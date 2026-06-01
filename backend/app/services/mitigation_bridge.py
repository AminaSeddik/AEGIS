"""
mitigation_bridge.py — Pure-Python mitigation bridge.

Drop-in replacement for the previous ctypes-based bridge. Wraps the
Python mitigation modules and exposes the SAME public interface the
FastAPI endpoints already call, so main.py works unchanged.

Why pure Python instead of the C/ctypes version:
  - No shared-library compilation step
  - No segfault risk taking down the FastAPI process
  - Thread-safe via the GIL + an explicit lock
  - Easier to debug and deploy
"""
from __future__ import annotations

import threading
from typing import List, Optional

from app.services.mitigation import aegis_stub
from app.services.mitigation.mitigation import AttackClass, ThreatLevel
from app.services.mitigation.actions import (
    mitigation_is_device_blocked,
    mitigation_unblock_device,
)
from app.services.mitigation.mitigation_engine import (
    mitigation_handle_event,
    mitigation_reset_confirmation,
)
from app.services.mitigation.aegis_stub import aegis_get_session, aegis_reset_all


# ── Notification log ─────────────────────────────────────────────
# Wraps notify_threat to record a time-ordered log for the dashboard.
_notify_log: List[dict] = []
_notify_log_lock = threading.Lock()
_original_notify = aegis_stub.AegisSession.notify_threat


def _logged_notify(self, level: ThreatLevel):
    _original_notify(self, level)
    with _notify_log_lock:
        _notify_log.append({
            "device_id": self.device_id,
            "threat_level": level.name,
        })


aegis_stub.AegisSession.notify_threat = _logged_notify


# ── Omar's ensemble class names → Mariam's AttackClass enum ──────
_CLASS_NAME_TO_ENUM = {
    "Benign":            AttackClass.BENIGN,
    "Reconnaissance":    AttackClass.RECONNAISSANCE,
    "ICMP_Flood":        AttackClass.ICMP_FLOOD,
    "ARP_Spoofing":      AttackClass.ARP_SPOOFING,
    "MQTT_Attack":       AttackClass.MQTT_ATTACK,
    "DoS":               AttackClass.DOS,
    "DDoS":              AttackClass.DDOS,
    "Ransomware":        AttackClass.RANSOMWARE,
    "Data_Exfiltration": AttackClass.DATA_EXFILTRATION,
    "ZERO_DAY":                  AttackClass.DDOS,
    "SUSPICIOUS_Benign":         AttackClass.RECONNAISSANCE,
    "SUSPICIOUS_DDoS":           AttackClass.DDOS,
    "SUSPICIOUS_DoS":            AttackClass.DOS,
    "SUSPICIOUS_ICMP_Flood":     AttackClass.ICMP_FLOOD,
    "SUSPICIOUS_Reconnaissance": AttackClass.RECONNAISSANCE,
}


class MitigationBridge:
    def __init__(self):
        self.is_ready: bool = True
        self.load_error: Optional[str] = None
        self._lock = threading.Lock()

    def handle_event(self, device_id: int, attack: AttackClass) -> None:
        with self._lock:
            mitigation_handle_event(device_id, attack)

    def handle_event_by_name(self, device_id: int, class_name: str) -> AttackClass:
        attack = _CLASS_NAME_TO_ENUM.get(class_name, AttackClass.RECONNAISSANCE)
        self.handle_event(device_id, attack)
        return attack

    def is_device_blocked(self, device_id: int) -> bool:
        with self._lock:
            return mitigation_is_device_blocked(device_id)

    def unblock_device(self, device_id: int) -> bool:
        with self._lock:
            return mitigation_unblock_device(device_id)

    def reset_confirmation(self, device_id: int) -> None:
        with self._lock:
            mitigation_reset_confirmation(device_id)

    def get_threat_level(self, device_id: int) -> Optional[ThreatLevel]:
        with self._lock:
            session = aegis_get_session(device_id)
            return session.last_threat

    def get_notify_count(self, device_id: int) -> int:
        with self._lock:
            session = aegis_get_session(device_id)
            return session.notify_call_count

    def get_recent_notifications(self, limit: int = 100) -> List[dict]:
        with _notify_log_lock:
            return list(_notify_log[-limit:])

    def reset_stub(self) -> None:
        with self._lock:
            aegis_reset_all()
        with _notify_log_lock:
            _notify_log.clear()

    def health(self) -> dict:
        return {
            "ready": self.is_ready,
            "implementation": "pure-python",
            "load_error": self.load_error,
            "known_classes": [c.name for c in AttackClass],
            "ensemble_class_mapping": {
                k: v.name for k, v in _CLASS_NAME_TO_ENUM.items()
            },
        }


mitigation = MitigationBridge()
