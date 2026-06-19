#!/usr/bin/env python3
"""
aegis_tamper_tester.py — Security validation suite for the Pi gateway.

This is the reference implementation of the tamper-test harness used to
verify the AEGIS-AEAD security properties on live hardware. It generates
valid encrypted packets and then applies three classes of attack against
the gateway:

  Class 1 — bit-flip tamper (modifies one bit of ciphertext)
  Class 2 — patient-ID substitution (changes patient ID in AAD)
  Class 3 — priority-downgrade (modifies priority byte in AAD)

The gateway must reject every tampered packet via AEGIS_ERR_VERIFY_FAIL.
Test cases TC-CR-02, TC-CR-03, and TC-CR-04 in the thesis correspond
directly to these classes.
"""
import ctypes
import os
import time
import sys
from datetime import datetime
import paho.mqtt.publish as publish

LIB_PATH = os.path.expanduser("~/aegis-crypto/libaegiscrypto.so")
lib = ctypes.CDLL(LIB_PATH)

AEGIS_KEY_BYTES, AEGIS_NONCE_BYTES, AEGIS_TAG_BYTES = 16, 16, 16
WIRE_VERSION = 0x01
DEMO_KEY     = bytes(range(16))

PRIORITY = {"CRITICAL": 0xC0, "HIGH": 0x80, "NORMAL": 0x40, "LOW": 0x10}
DEPT     = {"ICU": 0x01, "ER": 0x02, "Ward": 0x03, "OR": 0x04}

# Reference node for tampering tests (Node #1 ICU-HR, patient 1138)
TEST_NODE = {
    "name":       "Node1-ICU-HR",
    "dept":       "ICU",
    "device_id":  bytes.fromhex("78421ca2b5a40001"),
    "patient_id": 1138,
    "topic":      "aegis/icu/vitals",
}

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


def build_valid_packet(plaintext="HR=72", priority_name="NORMAL"):
    """Build a valid encrypted packet for the test node."""
    ts_ms     = int(time.time() * 1000)
    nonce     = TEST_NODE["device_id"] + ts_ms.to_bytes(8, 'big')
    pt_bytes  = plaintext.encode('utf-8')
    ct_len    = len(pt_bytes)
    ct_buf    = ctypes.create_string_buffer(ct_len)
    tag_buf   = ctypes.create_string_buffer(16)

    ctx = AegisContext()
    for i, b in enumerate(TEST_NODE["device_id"]):                       ctx.device_id[i]  = b
    for i, b in enumerate(TEST_NODE["patient_id"].to_bytes(8, 'big')):  ctx.patient_id[i] = b
    ctx.department   = DEPT[TEST_NODE["dept"]]
    ctx.timestamp_ms = ts_ms

    rc = lib.aegis_encrypt_packet(
        None, 0, ctypes.byref(ctx),
        DEMO_KEY, nonce, ct_len,
        pt_bytes, ct_buf
    )
    if rc != 0:
        raise RuntimeError(f"encrypt failed: rc={rc}")

    header = bytes([
        WIRE_VERSION,
        PRIORITY[priority_name],
        DEPT[TEST_NODE["dept"]],
        ct_len,
    ])
    return bytearray(header + TEST_NODE["device_id"]
                     + TEST_NODE["patient_id"].to_bytes(8, 'big')
                     + ts_ms.to_bytes(8, 'big')
                     + nonce + tag_buf.raw[:16] + ct_buf.raw[:ct_len])


def test_class_1_bit_flip(n=3):
    """TC-CR-02: bit-flip in ciphertext — must be rejected."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] === Class 1: BIT-FLIP TAMPER ===")
    for i in range(n):
        pkt = build_valid_packet()
        pkt[60] ^= 0x01  # flip first bit of ciphertext
        publish.single(TEST_NODE["topic"], bytes(pkt), hostname="localhost", port=1883)
        print(f"  [{i+1}/{n}] sent bit-flipped packet (expect VERIFY_FAIL on gateway)")
        time.sleep(1)


def test_class_2_cross_patient(n=3):
    """TC-CR-03: cross-patient substitution — must be rejected."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] === Class 2: CROSS-PATIENT SUBSTITUTION ===")
    for i in range(n):
        pkt = build_valid_packet()
        # Replace patient_id (offset 12) with patient 2025 instead of 1138
        for j, b in enumerate((2025).to_bytes(8, 'big')):
            pkt[12 + j] = b
        publish.single(TEST_NODE["topic"], bytes(pkt), hostname="localhost", port=1883)
        print(f"  [{i+1}/{n}] sent cross-patient packet (1138 → 2025) "
              f"(expect VERIFY_FAIL on gateway)")
        time.sleep(1)


def test_class_3_priority_downgrade(n=3):
    """TC-CR-04: priority downgrade — must be rejected."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] === Class 3: PRIORITY DOWNGRADE ===")
    for i in range(n):
        pkt = build_valid_packet(priority_name="CRITICAL")
        pkt[1] = PRIORITY["NORMAL"]  # downgrade CRITICAL → NORMAL
        publish.single(TEST_NODE["topic"], bytes(pkt), hostname="localhost", port=1883)
        print(f"  [{i+1}/{n}] sent priority-downgraded packet (CRITICAL → NORMAL) "
              f"(expect VERIFY_FAIL on gateway)")
        time.sleep(1)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    print(f"AEGIS tamper-test harness")
    print(f"target broker: localhost:1883")
    print(f"target node:   {TEST_NODE['name']}")
    print(f"mode:          {mode}")

    if mode in ("all", "tag-tamper", "bit-flip"):
        test_class_1_bit_flip()
    if mode in ("all", "cross-patient"):
        test_class_2_cross_patient()
    if mode in ("all", "priority"):
        test_class_3_priority_downgrade()

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ✓ tamper tests dispatched")
    print(f"  → check the gateway log for VERIFY_FAIL entries (one per packet)")


if __name__ == "__main__":
    main()
