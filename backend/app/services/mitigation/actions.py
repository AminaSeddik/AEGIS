"""actions.py — Action handlers. Operator unblock + HIPAA CSV audit log."""
import time, csv, os
from datetime import datetime
from .mitigation import (
    AttackClass, MitigationAction, ThreatLevel,
    ATTACK_NAMES, ACTION_NAMES, RATE_LIMIT_MAX, WINDOW_SECONDS
)
from .aegis_stub import aegis_get_session

_blocked_devices: set = set()

def mitigation_is_device_blocked(device_id: int) -> bool:
    return device_id in _blocked_devices

def _block_device(device_id: int):
    _blocked_devices.add(device_id)

def mitigation_unblock_device(device_id: int) -> bool:
    if device_id in _blocked_devices:
        _blocked_devices.remove(device_id)
        session = aegis_get_session(device_id)
        session.notify_threat(ThreatLevel.LOW)
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] UNBLOCK - Device {device_id} restored (operator override)")
        return True
    return False

_rate_table: dict = {}

def action_rate_limit(device_id: int) -> bool:
    now = time.time()
    if device_id not in _rate_table:
        _rate_table[device_id] = []
    _rate_table[device_id] = [t for t in _rate_table[device_id] if now - t < WINDOW_SECONDS]
    if len(_rate_table[device_id]) >= RATE_LIMIT_MAX:
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] RATE_LIMIT - Device {device_id} packet DROPPED (>{RATE_LIMIT_MAX} pkt/s)")
        return False
    _rate_table[device_id].append(now)
    return True

def action_log_only(device_id: int, attack: AttackClass):
    ts = datetime.now().strftime("%H:%M:%S")
    name = ATTACK_NAMES.get(attack, "Unknown")
    print(f"[{ts}] Device {device_id} -> {name}")

def action_session_rekey(device_id: int):
    ts = datetime.now().strftime("%H:%M:%S")
    session = aegis_get_session(device_id)
    session.notify_threat(ThreatLevel.HIGH)
    print(f"[{ts}] SESSION_REKEY - Device {device_id} notified AEGIS (THREAT_HIGH)")

def action_device_isolate(device_id: int):
    ts = datetime.now().strftime("%H:%M:%S")
    _block_device(device_id)
    session = aegis_get_session(device_id)
    session.notify_threat(ThreatLevel.CRITICAL)
    print(f"[{ts}] DEVICE_ISOLATE - Device {device_id} blocked + AEGIS (THREAT_CRITICAL)")

AUDIT_LOG_FILE = "mitigation_audit.log"
_audit_initialized = False

def _ensure_audit_log():
    global _audit_initialized
    if _audit_initialized:
        return
    if not os.path.exists(AUDIT_LOG_FILE) or os.path.getsize(AUDIT_LOG_FILE) == 0:
        with open(AUDIT_LOG_FILE, "w", newline="") as f:
            csv.writer(f).writerow(["timestamp_iso8601", "device_id", "attack_class", "action", "outcome"])
    _audit_initialized = True

def audit_log(device_id: int, attack: AttackClass, action: MitigationAction):
    _ensure_audit_log()
    iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    aname  = ATTACK_NAMES.get(attack, "Unknown")
    acname = ACTION_NAMES.get(action, "Unknown")
    with open(AUDIT_LOG_FILE, "a", newline="") as f:
        csv.writer(f).writerow([iso, device_id, aname, acname, "applied"])
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] AUDIT - Device {device_id} -> {aname} -> {acname}")
