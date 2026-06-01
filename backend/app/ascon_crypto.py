import ctypes
import os
import sys
from pathlib import Path
from dataclasses import dataclass

_LIB_PATH = Path(__file__).parent / "build" / "libascon.so"

try:
    _lib = ctypes.CDLL(str(_LIB_PATH))
except OSError as e:
    sys.exit(f"[AEGIS] FATAL: Cannot load libascon.so\n{e}")

_lib.aegis_encrypt.restype  = ctypes.c_int
_lib.aegis_encrypt.argtypes = [
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.POINTER(ctypes.c_size_t),
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.c_size_t,
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.c_size_t,
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.POINTER(ctypes.c_uint8),
]

_lib.aegis_decrypt.restype  = ctypes.c_int
_lib.aegis_decrypt.argtypes = [
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.POINTER(ctypes.c_size_t),
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.c_size_t,
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.c_size_t,
    ctypes.POINTER(ctypes.c_uint8),
    ctypes.POINTER(ctypes.c_uint8),
]

KEY_LEN   = 16
NONCE_LEN = 16
TAG_LEN   = 16

def _buf(b):
    return (ctypes.c_uint8 * len(b)).from_buffer_copy(b)

@dataclass
class EncryptedPacket:
    ciphertext : bytes
    tag        : bytes
    nonce      : bytes
    blob       : bytes

def encrypt(plaintext: bytes, key: bytes, associated_data: bytes = b"") -> EncryptedPacket:
    if len(key) != KEY_LEN:
        raise ValueError(f"Key must be {KEY_LEN} bytes")
    nonce    = os.urandom(NONCE_LEN)
    out_size = len(plaintext) + TAG_LEN
    out_buf  = (ctypes.c_uint8 * out_size)()
    out_len  = ctypes.c_size_t(0)
    ad_buf   = _buf(associated_data) if associated_data else None
    ret = _lib.aegis_encrypt(
        out_buf, ctypes.byref(out_len),
        _buf(plaintext) if plaintext else None, len(plaintext),
        ad_buf, len(associated_data),
        _buf(nonce), _buf(key),
    )
    if ret != 0:
        raise RuntimeError("ASCON encryption failed")
    blob = bytes(out_buf[:out_len.value])
    return EncryptedPacket(blob[:-TAG_LEN], blob[-TAG_LEN:], nonce, blob)

def decrypt(blob: bytes, nonce: bytes, key: bytes, associated_data: bytes = b""):
    if len(key) != KEY_LEN:
        raise ValueError(f"Key must be {KEY_LEN} bytes")
    if len(nonce) != NONCE_LEN:
        raise ValueError(f"Nonce must be {NONCE_LEN} bytes")
    if len(blob) < TAG_LEN:
        return None
    pt_size = len(blob) - TAG_LEN
    out_buf  = (ctypes.c_uint8 * max(pt_size, 1))()
    out_len  = ctypes.c_size_t(0)
    ad_buf   = _buf(associated_data) if associated_data else None
    ret = _lib.aegis_decrypt(
        out_buf, ctypes.byref(out_len),
        _buf(blob), len(blob),
        ad_buf, len(associated_data),
        _buf(nonce), _buf(key),
    )
    if ret != 0:
        return None
    return bytes(out_buf[:out_len.value])
