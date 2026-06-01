"""
ensemble_predictor.py — AEGIS Phase 2 ensemble model service.

Loads three pre-trained models at import time and exposes a single
`ensemble.predict(features)` function that runs all three and applies
the ensemble decision logic from Omar's specification.

Input:  list/np.array of 39 floats, in models/features.json order.
Output: dict with predicted_class, confidence, is_zero_day,
        is_suspicious, plus per-model breakdown.

If any model fails to load, `ensemble.is_ready` is False and predict()
raises RuntimeError. Health endpoints should check ensemble.health()
before calling predict.
"""
from __future__ import annotations

import json
import os
import pickle
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

_MODEL_DIR_ENV = "AEGIS_MODEL_DIR"
_DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent / "ai_models"

EXPECTED_FEATURE_COUNT = 39


class EnsemblePredictor:
    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = Path(model_dir) if model_dir else Path(
            os.environ.get(_MODEL_DIR_ENV, _DEFAULT_MODEL_DIR)
        )
        self.is_ready: bool = False
        self.load_error: Optional[str] = None
        self.rf = None
        self.cnn = None
        self.ae = None
        self.scaler = None
        self.label_encoder = None
        self.threshold: float = 0.0
        self.feature_names: List[str] = []
        self.known_classes: List[str] = []
        self._lock = threading.Lock()
        self._load()

    def _load(self) -> None:
        try:
            from tensorflow.keras.models import load_model

            d = self.model_dir
            if not d.exists():
                raise FileNotFoundError(f"model dir not found: {d}")

            self.rf = joblib.load(d / "random_forest.pkl")
            self.cnn = load_model(d / "cnn_lstm_final.keras", compile=False)
            self.ae = load_model(d / "autoencoder.keras", compile=False)
            self.scaler = joblib.load(d / "scaler.pkl")
            self.label_encoder = joblib.load(d / "label_encoder.pkl")

            with open(d / "threshold.pkl", "rb") as f:
                self.threshold = float(pickle.load(f))

            with open(d / "features.json") as f:
                self.feature_names = json.load(f)["features"]

            if len(self.feature_names) != EXPECTED_FEATURE_COUNT:
                raise ValueError(
                    f"features.json declares {len(self.feature_names)} "
                    f"features; expected {EXPECTED_FEATURE_COUNT}"
                )

            self.known_classes = [str(c) for c in self.label_encoder.classes_]
            self._warmup()
            self.is_ready = True
            self.load_error = None
        except Exception as exc:
            self.is_ready = False
            self.load_error = f"{type(exc).__name__}: {exc}"

    def _warmup(self) -> None:
        dummy = np.zeros((1, EXPECTED_FEATURE_COUNT), dtype=np.float32)
        scaled = self.scaler.transform(dummy)
        self.rf.predict(scaled)
        self.cnn.predict(scaled.reshape(1, EXPECTED_FEATURE_COUNT, 1), verbose=0)
        self.ae.predict(scaled, verbose=0)

    def health(self) -> Dict[str, Any]:
        return {
            "ready": self.is_ready,
            "model_dir": str(self.model_dir),
            "models_loaded": {
                "random_forest": self.rf is not None,
                "cnn_lstm": self.cnn is not None,
                "autoencoder": self.ae is not None,
                "scaler": self.scaler is not None,
                "label_encoder": self.label_encoder is not None,
            },
            "known_classes": self.known_classes,
            "feature_count": len(self.feature_names),
            "anomaly_threshold": self.threshold,
            "load_error": self.load_error,
        }

    def predict(self, features: List[float]) -> Dict[str, Any]:
        if not self.is_ready:
            raise RuntimeError(
                f"ensemble not ready: {self.load_error or 'unknown error'}"
            )
        if len(features) != EXPECTED_FEATURE_COUNT:
            raise ValueError(
                f"expected {EXPECTED_FEATURE_COUNT} features, got {len(features)}"
            )

        x = np.asarray(features, dtype=np.float32).reshape(1, -1)

        with self._lock:
            x_scaled = self.scaler.transform(x)
            rf_class = str(self.rf.predict(x_scaled)[0])
            rf_proba = self.rf.predict_proba(x_scaled)[0]
            rf_conf = float(rf_proba.max())

            x_cnn = x_scaled.reshape(1, EXPECTED_FEATURE_COUNT, 1)
            cnn_proba = self.cnn.predict(x_cnn, verbose=0)[0]
            cnn_idx = int(np.argmax(cnn_proba))
            cnn_class = str(self.label_encoder.inverse_transform([cnn_idx])[0])
            cnn_conf = float(cnn_proba.max())

            x_recon = self.ae.predict(x_scaled, verbose=0)
            anomaly_score = float(np.mean(np.square(x_scaled - x_recon)))
            is_anomaly = anomaly_score > self.threshold

        classifiers_agree = rf_class == cnn_class
        is_zero_day = False
        is_suspicious = False

        if is_anomaly and not classifiers_agree:
            predicted_class = "ZERO_DAY"
            confidence = anomaly_score
            is_zero_day = True
        elif is_anomaly and rf_conf < 0.70:
            predicted_class = "ZERO_DAY"
            confidence = anomaly_score
            is_zero_day = True
        elif is_anomaly and classifiers_agree:
            predicted_class = f"SUSPICIOUS_{rf_class}"
            confidence = min(rf_conf, cnn_conf)
            is_suspicious = True
        elif classifiers_agree:
            predicted_class = rf_class
            confidence = (rf_conf + cnn_conf) / 2.0
        else:
            if rf_conf >= cnn_conf:
                predicted_class = rf_class
                confidence = rf_conf
            else:
                predicted_class = cnn_class
                confidence = cnn_conf

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "is_zero_day": is_zero_day,
            "is_suspicious": is_suspicious,
            "rf_class": rf_class,
            "rf_confidence": rf_conf,
            "cnn_class": cnn_class,
            "cnn_confidence": cnn_conf,
            "anomaly_score": anomaly_score,
            "anomaly_threshold": self.threshold,
        }


ensemble = EnsemblePredictor()
