# AEGIS

AI-Enhanced Guardian for IoT Security — the integrated runtime of the AEGIS framework for medical IoT networks. This repository hosts the backend, the AI detection ensemble, the operator dashboard, the mitigation engine, and the Raspberry Pi gateway reference implementation.

## Contributions

1. **FastAPI backend** — REST and WebSocket service that ingests decrypted telemetry from the Pi gateway, runs every flow through the AI ensemble, evaluates mitigation policy, and streams live state to the dashboard. Includes a HIPAA-aligned append-only audit log compliant with 45 CFR §164.312(b).

2. **AI detection ensemble** — three-model architecture combining a Random Forest classifier (96.32% accuracy on known classes), a CNN-LSTM hybrid for sequential patterns, and an Autoencoder zero-day detector trained on benign-only traffic. Ensemble accuracy 96.08% on CICIoMT2024 with 100% detection on held-out classes and 99.1% cross-domain detection on CICIoT2023.

3. **Operator dashboard** — React/TypeScript single-page application with eight specialised views (Overview, Alerts, Network Map, Devices, Detection Engine, Response, Crypto Health, Reports), live WebSocket updates, and one-click operator override.

4. **Mitigation engine** — four-tier graded escalation (LOG_ONLY → RATE_LIMIT → SESSION_REKEY → DEVICE_ISOLATE) with a three-strike confirmation gate that prevents single misclassification from impacting clinical care. 11 test cases with 35 of 35 assertions passing.

5. **Pi gateway reference implementation** — Python wrapper scripts matching the production scripts deployed on the two Raspberry Pi 4 gateways, including MQTT subscriber, simulated publisher, tamper tester, and self-test for `libaegiscrypto.so`.

## Build and run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8055   # backend on port 8055
cd dashboard && npm install && npm run dev        # dashboard on port 5173
```

## Repository layout

```
app/                       FastAPI backend, AI services, mitigation, audit
dashboard/                 React/TypeScript operator dashboard
backend/app/mitigation_c/  Mitigation engine package
pi-gateway/                Pi-side reference implementation (Python)
data/                      Preprocessed CICIoMT2024 and CICIoT2023 splits
models/                    Trained AI artifacts (RF, CNN-LSTM, AE, threshold)
tests/                     Integration tests
scripts/                   Figure regeneration, benchmarks, data preprocessing
```

## Author

Amina Seddik (Nile University, ITCS).

## Project context

Part of the AEGIS senior project at Nile University, supervised by Dr. Noha Gamal El-Dien and Dr. Mohamed El-Helw.
Team: Amina Seddik (encryption + dashboard + hardware), Omar Moustafa (AI/ML), Mariam Basem (mitigation).

Related repositories:
- [aegis-crypto](https://github.com/AminaSeddik/aegis-crypto) — AEGIS-AEAD cryptographic library
- [aegis-firmware](https://github.com/AminaSeddik/aegis-firmware) — ESP32 firmware (private)
- [aegis-omnet](https://github.com/AminaSeddik/aegis-omnet) — OMNeT++ hospital network simulation

## License

Academic use under Nile University ITCS supervision.
