#!/usr/bin/env python3
"""
aegis_subscriber.py — Pi-side MQTT subscriber, AEGIS v1 wire format.

This is the reference implementation of the AEGIS Pi gateway subscriber as
deployed on the two Raspberry Pi 4 gateways (one per department: ICU + ER).
The script subscribes to encrypted MQTT telemetry from the ESP32 sensor
nodes, verifies and decrypts each packet against the AEGIS-AEAD wire
format, and forwards the decrypted reading to the backend over HTTP.

Wire format (per AEGIS handoff §4.2):
    version(1) | priority(1) | department(1) | ct_len(1)
    device_id(8) | patient_id(8) | timestamp_ms_BE(8)
    nonce(16) | tag(16) | ciphertext(ct_len)
Total = 60 + ct_len bytes.

Subscribes to: aegis/+/vitals  (all departments)
After a successful decrypt, the reading is forwarded (fire-and-forget) to
the AEGIS backend at BACKEND_URL for dashboard display.
"""
import ctypes
import os
import sys
import threading
from datetime import datetime
import paho.mqtt.client as mqtt
import requests

# ─── library loading ──────────────────────────────────────────────
LIB_PATH = os.path.expanduser("~/aegis-crypto/libaegiscrypto.so")
lib = ctypes.CDLL(LIB_PATH)

# ─── AEGIS-AEAD constants (from aegis_crypto.h) ──────────────────
AEGIS_KEY_BYTES, AEGIS_NONCE_BYTES, AEGIS_TAG_BYTES = 16, 16, 16
AEGIS_DEVICE_ID_BYTES, AEGIS_PATIENT_ID_BYTES = 8, 8
AEGIS_OK, AEGIS_ERR_VERIFY_FAIL = 0, -2

WIRE_VERSION      = 0x01
WIRE_HEADER_BYTES = 60

PRIORITY_NAMES = {0xC0: "CRITICAL", 0x80: "HIGH", 0x40: "NORMAL", 0x10: "LOW"}
DEPT_NAMES     = {0x01: "ICU", 0x02: "ER", 0x03: "Ward", 0x04: "OR"}

DEMO_KEY = bytes(range(16))   # 0x00..0x0F demo key; production: HSM-derived

# ─── backend forwarder config ────────────────────────────────────
BACKEND_URL           = "http://192.168.1.194:8055/api/aegis/sensor"
FORWARDER_TIMEOUT_SEC = 2.0

# ─── ctypes bindings to libaegiscrypto.so ────────────────────────
class AegisContext(ctypes.Structure):
    _fields_ = [
        ("device_id",    ctypes.c_uint8 * AEGIS_DEVICE_ID_BYTES),
        ("patient_id",   ctypes.c_uint8 * AEGIS_PATIENT_ID_BYTES),
        ("department",   ctypes.c_uint8),
        ("timestamp_ms", ctypes.c_uint64),
    ]

lib.aegis_session_create.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p]
lib.aegis_session_create.restype  = ctypes.c_void_p

lib.aegis_decrypt_packet.argtypes = [
    ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(AegisContext),
    ctypes.c_char_p, ctypes.c_char_p, ctypes.c_size_t,
    ctypes.c_char_p, ctypes.c_char_p,
]
lib.aegis_decrypt_packet.restype  = ctypes.c_int

# ─── forwarder stats ─────────────────────────────────────────────
_forwarder_stats = {"sent": 0, "failed": 0}

def forward_to_backend(payload):
    """POST a decrypted reading to the backend. Fire-and-forget."""
    try:
        r = requests.post(BACKEND_URL, json=payload, timeout=FORWARDER_TIMEOUT_SEC)
        if r.status_code == 200:
            _forwarder_stats["sent"] += 1
        else:
            _forwarder_stats["failed"] += 1
            print(f"[forwarder] backend returned {r.status_code}: {r.text[:120]}")
    except requests.exceptions.RequestException as e:
        _forwarder_stats["failed"] += 1
        print(f"[forwarder] failed: {e}")

# ─── MQTT callbacks ──────────────────────────────────────────────
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ connected to broker")
        client.subscribe("aegis/+/vitals")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] subscribed to aegis/+/vitals")
    else:
        print(f"[mqtt] connect failed: {reason_code}")

def on_message(client, userdata, msg):
    raw = msg.payload
    if len(raw) < WIRE_HEADER_BYTES:
        print(f"[!] packet too short: {len(raw)} < {WIRE_HEADER_BYTES}")
        return

    # Parse header (per AEGIS wire format §4.2)
    version   = raw[0]
    priority  = raw[1]
    dept_code = raw[2]
    ct_len    = raw[3]

    if version != WIRE_VERSION:
        print(f"[!] unknown wire version: 0x{version:02x}")
        return

    device_id    = raw[4:12]
    patient_id   = raw[12:20]
    timestamp    = int.from_bytes(raw[20:28], 'big')
    nonce        = raw[28:44]
    tag          = raw[44:60]
    ciphertext   = raw[60:60+ct_len]

    prio_name    = PRIORITY_NAMES.get(priority, f"UNK_0x{priority:02x}")
    dept_name    = DEPT_NAMES.get(dept_code, f"UNK_0x{dept_code:02x}")

    # Build AAD (additional authenticated data) = 24-byte context block
    aad = device_id + patient_id + timestamp.to_bytes(8, 'big')

    # Decrypt with libaegiscrypto.so
    plaintext = ctypes.create_string_buffer(ct_len)
    ctx       = AegisContext()
    for i, b in enumerate(device_id):    ctx.device_id[i]   = b
    for i, b in enumerate(patient_id):   ctx.patient_id[i]  = b
    ctx.department   = dept_code
    ctx.timestamp_ms = timestamp

    rc = lib.aegis_decrypt_packet(
        None, 0, ctypes.byref(ctx),
        DEMO_KEY, nonce, ct_len,
        ciphertext, tag
    )

    if rc == AEGIS_ERR_VERIFY_FAIL:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ TAMPER REJECTED  "
              f"dev={device_id.hex()[:8]} pat={int.from_bytes(patient_id,'big')}")
        return

    if rc != AEGIS_OK:
        print(f"[!] decrypt error rc={rc}")
        return

    # Successful decrypt — display + forward
    display_text = plaintext.raw[:ct_len].decode('utf-8', errors='replace').rstrip('\x00')
    print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ "
          f"{dept_name}/{prio_name}  dev={device_id.hex()[:8]}  "
          f"pat={int.from_bytes(patient_id,'big')}  '{display_text}'")

    # ─── forward to backend (fire-and-forget, background thread) ──
    forward_payload = {
        "device_id":    device_id.hex(),
        "patient_id":   int.from_bytes(patient_id, 'big'),
        "department":   dept_name,
        "priority":     prio_name,
        "plaintext":    display_text,
        "timestamp_ms": timestamp,
        "nonce_hex":    nonce.hex(),
        "tag_hex":      tag.hex(),
    }
    threading.Thread(
        target=forward_to_backend,
        args=(forward_payload,),
        daemon=True,
    ).start()

# ─── main entry point ────────────────────────────────────────────
def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="aegis-pi-subscriber")
    client.on_connect = on_connect
    client.on_message = on_message
    print(f"[{datetime.now().strftime('%H:%M:%S')}] connecting to broker at localhost:1883...")
    client.connect("localhost", 1883, keepalive=60)
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print(f"\n[shutdown] received Ctrl-C")
        print(f"[forwarder stats] sent={_forwarder_stats['sent']}  failed={_forwarder_stats['failed']}")
        client.disconnect()

if __name__ == "__main__":
    main()
