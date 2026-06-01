"""aegis_stub.py — AEGIS session stub."""
from .mitigation import ThreatLevel

class AegisSession:
    def __init__(self, device_id: int):
        self.device_id        = device_id
        self.last_threat      = ThreatLevel.LOW
        self.notify_call_count = 0

    def notify_threat(self, level: ThreatLevel):
        self.last_threat = level
        self.notify_call_count += 1

_sessions: dict = {}

def aegis_get_session(device_id: int) -> AegisSession:
    if device_id not in _sessions:
        _sessions[device_id] = AegisSession(device_id)
    return _sessions[device_id]

def aegis_reset_all():
    _sessions.clear()
