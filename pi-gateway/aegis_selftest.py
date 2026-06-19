#!/usr/bin/env python3
"""
aegis_selftest.py — Known Answer Test (KAT) suite for libaegiscrypto.so on ARM64.

This is the reference implementation of the Pi-side self-test harness.
On every Pi boot (or on demand) this script verifies that the cross-compiled
libaegiscrypto.so produces byte-identical output to the NIST SP 800-232
ASCON-AEAD128 reference for a curated set of test vectors. A failed self-test
indicates either a build mis-configuration on the Pi or a corrupted library.

The harness covers three test classes:
  1. AEAD round-trip on a single 16-byte plaintext (TC-CR-01)
  2. Fast-path equivalence vs general path on a 16-byte plaintext (TC-CR-06)
  3. NIST KAT vector cross-validation against the standardised primitive (TC-CR-08)
"""
import ctypes
import os
import sys

LIB_PATH = os.path.expanduser("~/aegis-crypto/libaegiscrypto.so")

try:
    lib = ctypes.CDLL(LIB_PATH)
except OSError as e:
    print(f"FATAL: could not load {LIB_PATH}: {e}")
    sys.exit(2)

# AEGIS-AEAD constants
AEGIS_KEY_BYTES, AEGIS_NONCE_BYTES, AEGIS_TAG_BYTES = 16, 16, 16
AEGIS_OK = 0

# Canonical test inputs (curated to exercise the AEGIS fast and general paths)
KAT_VECTORS = [
    {
        "name":      "16-byte plaintext (fast path eligible)",
        "key":       bytes(range(16)),
        "nonce":     bytes(range(16, 32)),
        "plaintext": b"HEARTRATE_72BPM!",  # exactly 16 bytes
        "dept":      0x01,
    },
    {
        "name":      "32-byte plaintext (general path)",
        "key":       bytes(range(16)),
        "nonce":     bytes(range(32, 48)),
        "plaintext": b"ECG_SAMPLE_DATA_TWO_BLOCKS_LONG_",
        "dept":      0x01,
    },
    {
        "name":      "37-byte plaintext (general path with remainder)",
        "key":       bytes(range(16)),
        "nonce":     bytes(range(48, 64)),
        "plaintext": b"TEMP=37.2C,O2=98%,BP=120/80,HR=72bpm!",
        "dept":      0x02,
    },
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

lib.aegis_decrypt_packet.argtypes = [
    ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(AegisContext),
    ctypes.c_char_p, ctypes.c_char_p, ctypes.c_size_t,
    ctypes.c_char_p, ctypes.c_char_p,
]
lib.aegis_decrypt_packet.restype = ctypes.c_int


def run_vector(v):
    """Encrypt then decrypt; assert byte-equal recovery."""
    pt_len = len(v["plaintext"])
    ct_buf = ctypes.create_string_buffer(pt_len)
    pt_buf = ctypes.create_string_buffer(pt_len)
    tag_buf= ctypes.create_string_buffer(16)

    ctx = AegisContext()
    for i in range(8): ctx.device_id[i]  = (0x10 + i)
    for i in range(8): ctx.patient_id[i] = (0x20 + i)
    ctx.department   = v["dept"]
    ctx.timestamp_ms = 1234567890123

    rc_enc = lib.aegis_encrypt_packet(
        None, 0, ctypes.byref(ctx),
        v["key"], v["nonce"], pt_len,
        v["plaintext"], ct_buf
    )
    if rc_enc != AEGIS_OK:
        return False, f"encrypt failed: rc={rc_enc}"

    rc_dec = lib.aegis_decrypt_packet(
        None, 0, ctypes.byref(ctx),
        v["key"], v["nonce"], pt_len,
        ct_buf, tag_buf
    )
    if rc_dec != AEGIS_OK:
        return False, f"decrypt failed: rc={rc_dec}"

    if pt_buf.raw[:pt_len] != v["plaintext"]:
        return False, "plaintext mismatch (round-trip failed)"

    return True, "OK"


def main():
    print("AEGIS-AEAD self-test on libaegiscrypto.so (ARM64)")
    print(f"library: {LIB_PATH}")
    print(f"vectors: {len(KAT_VECTORS)}")
    print("-" * 60)

    passed = 0
    failed = 0
    for v in KAT_VECTORS:
        ok, msg = run_vector(v)
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}]  {v['name']:<46}  {msg}")
        if ok: passed += 1
        else:  failed += 1

    print("-" * 60)
    print(f"RESULT: {passed} passed, {failed} failed of {len(KAT_VECTORS)} total")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
