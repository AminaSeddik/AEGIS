#!/usr/bin/env python3
"""
aegis_test_publisher.py — Simulated ESP32 publisher for Pi-side testing.

This is the reference implementation of the test publisher used to verify
the Pi gateway subscriber when physical ESP32 nodes are not available.
It generates AEGIS-AEAD encrypted packets matching the same wire format
as the real ESP32 firmware, signs them with libaegiscrypto.so, and
publishes them to the same MQTT broker that the subscriber listens on.

Wire format produced is identical to ESP32 firmware (see aegis_subscriber.py).
"""
import ctypes
import os
import time
import random
from datetime import datetime
import paho.mqtt.publish as publish

LIB_PATH = os.path.expanduser("~/aegis-crypto/libaegiscrypto.so")
lib = ctypes.CDLL(LIB_PATH)

# AEGIS-AEAD constants
AEGIS_KEY_BYTES, AEGIS_NONCE_BYTES, AEGIS_TAG_BYTES = 16, 16, 16
WIRE_VERSION = 0x01
DEMO_KEY     = bytes(range(16))

PRIORITY = {"CRITICAL": 0xC0, "HIGH": 0x80, "NORMAL": 0x40, "LOW": 0x10}
DEPT     = {"ICU": 0x01, "ER": 0x02, "Ward": 0x03, "OR": 0x04}

# ─── simulated nodes (mirror the 4 ESP32 deployment) ──────────────
NODES = [
    {"name": "Node1-ICU-HR",    "dept": "ICU", "device_id": bytes.fromhex("78421ca2b5a40001"), "patient_id": 1138, "topic": "aegis/icu/vitals"},
    {"name": "Node2-ICU-Vitals","dept": "ICU", "device_id": bytes.fromhex("78421ca2b5a40002"), "patient_id": 1138, "topic": "aegis/icu/vitals"},
    {"name": "Node3-ER-HR",     "dept": "ER",  "device_id": bytes.fromhex("78421ca2b5a40003"), "patient_id": 2025, "topic": "aegis/er/vitals"},
    {"name": "Node4-ER-Vitals", "dept": "ER",  "device_id": bytes.fromhex("78421ca2b5a40004"), "patient_id": 2025, "topic": "aegis/er/vitals"},
]

class AegisContext(ctypes.Structure):
    _fields_ = [
        ("device_id",    ctypes.c_uint8 * 8),
        ("patient_id",   ctypes.c_uint8 * 8),
        ("department",   ctypes.c_uint8),
        ("timestamp_ms", ctypes.c_uint64),
    ]

lib.aegis_encrypt_packet.argtypes = [
    ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(AegisContext),
    ctypes.c_char_p, ctypes.c_char_p, ctypes.c_size_t,
    ctypes.c_char_p, ctypes.c_char_p,
]
lib.aegis_encrypt_packet.restype = ctypes.c_int


def build_packet(node, priority_name, plaintext):
    """Encrypt plaintext for the given node and return the 60+N wire-format bytes."""
    ts_ms     = int(time.time() * 1000)
    nonce     = node["device_id"] + ts_ms.to_bytes(8, 'big')  # deterministic nonce
    pt_bytes  = plaintext.encode('utf-8')
    ct_len    = len(pt_bytes)
    ct_buf    = ctypes.create_string_buffer(ct_len)
    tag_buf   = ctypes.create_string_buffer(16)

    ctx = AegisContext()
    for i, b in enumerate(node["device_id"]):                   ctx.device_id[i]  = b
    for i, b in enumerate(node["patient_id"].to_bytes(8, 'big')): ctx.patient_id[i] = b
    ctx.department   = DEPT[node["dept"]]
    ctx.timestamp_ms = ts_ms

    rc = lib.aegis_encrypt_packet(
        None, 0, ctypes.byref(ctx),
        DEMO_KEY, nonce, ct_len,
        pt_bytes, ct_buf
    )
    if rc != 0:
        raise RuntimeError(f"encrypt failed: rc={rc}")

    # Build wire-format packet
    header = bytes([
        WIRE_VERSION,
        PRIORITY[priority_name],
        DEPT[node["dept"]],
        ct_len,
    ])
    return (header + node["device_id"] + node["patient_id"].to_bytes(8, 'big')
            + ts_ms.to_bytes(8, 'big') + nonce + tag_buf.raw[:16] + ct_buf.raw[:ct_len])


def simulate_reading(node):
    """Generate a plausible vital-sign reading for the node."""
    if "HR" in node["name"]:
        hr = random.randint(60, 95)
        return f"HR={hr}", random.choice(["NORMAL", "NORMAL", "NORMAL", "HIGH"])
    else:  # Vitals: temp + ECG sample
        temp = round(random.uniform(36.4, 37.8), 1)
        return f"TEMP={temp}", random.choice(["NORMAL", "NORMAL", "HIGH"])


def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] AEGIS test publisher started")
    print(f"[publisher] simulating {len(NODES)} nodes, publishing every 5 seconds")
    print(f"[publisher] press Ctrl-C to stop\n")

    try:
        while True:
            for node in NODES:
                plaintext, priority = simulate_reading(node)
                pkt = build_packet(node, priority, plaintext)
                publish.single(node["topic"], pkt, hostname="localhost", port=1883)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                      f"{node['name']:<22} → {node['topic']:<20} {priority:<8} '{plaintext}'")
                time.sleep(0.5)
            time.sleep(3)
    except KeyboardInterrupt:
        print(f"\n[publisher] stopped")


if __name__ == "__main__":
    main()
