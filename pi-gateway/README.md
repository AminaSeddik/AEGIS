# AEGIS Pi Gateway — Reference Implementation

This folder contains the Python wrapper scripts deployed on the two
Raspberry Pi 4 gateways (one per department: ICU + ER) in the AEGIS
hospital IoT security platform.

> **Note on this folder:** the Python scripts in this folder are the
> reference implementation matching the AEGIS Pi gateway architecture.
> The production scripts on the Raspberry Pi hardware are functionally
> equivalent — they call the same `libaegiscrypto.so` (cross-compiled
> for ARM64) and implement the same wire format. Re-deploying these
> scripts on a fresh Pi reproduces the gateway behaviour described in
> Chapter 5 of the thesis.

## Files

| File | Purpose |
|---|---|
| `aegis_subscriber.py` | MQTT subscriber + AEGIS-AEAD decryptor + backend forwarder |
| `aegis_test_publisher.py` | Simulated 4-node publisher for end-to-end testing without ESP32s |
| `aegis_tamper_tester.py` | Security validation: bit-flip, cross-patient, priority-downgrade |
| `aegis_selftest.py` | KAT vector self-test for `libaegiscrypto.so` on ARM64 |

## Wire Format

All scripts follow the AEGIS-AEAD wire format (Thesis Appendix E):

```
version(1) | priority(1) | department(1) | ct_len(1)        ← 4-byte header
device_id(8) | patient_id(8) | timestamp_ms_BE(8)            ← 24-byte AAD
nonce(16) | tag(16) | ciphertext(ct_len)                     ← AEAD payload
```

Total packet size: **60 + ct_len bytes** (60 + 16 = 76 bytes for the modal
single-block medical reading).

## Running the Gateway

```bash
# 1. Build libaegiscrypto.so for ARM64 (from aegis-crypto repo)
cd ~/aegis-crypto && make ARCH=arm64

# 2. Start Mosquitto broker (one per Pi gateway)
sudo systemctl start mosquitto

# 3. Run the subscriber
python3 aegis_subscriber.py
```

The subscriber connects to the local Mosquitto on port 1883, subscribes
to `aegis/+/vitals`, and forwards every successfully decrypted reading
to the backend at `BACKEND_URL` (default: `http://192.168.1.194:8055`).

## Running the Tamper Tests

```bash
# Test all three tamper classes
python3 aegis_tamper_tester.py all

# Or run one class
python3 aegis_tamper_tester.py tag-tamper       # bit-flip
python3 aegis_tamper_tester.py cross-patient    # AAD substitution
python3 aegis_tamper_tester.py priority         # priority downgrade
```

Every tampered packet must produce a `VERIFY_FAIL` entry in the
subscriber log on the gateway.

## Self-Test

```bash
python3 aegis_selftest.py
```

Expected output: `RESULT: 3 passed, 0 failed of 3 total` (exit code 0).
A failed self-test indicates either a library build problem or a
corrupted `libaegiscrypto.so`.

## Architecture in Context

See:
- **Thesis Chapter 5** (System Implementation) — full deployment details
- **Thesis Appendix E** — AEGIS-AEAD wire format specification
- **Thesis Appendix J** — formal test cases (TC-CR-01 through TC-CR-08)
- **Thesis Appendix L** — installation and run guide
