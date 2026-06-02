"""
mitigation_engine.py — Main mitigation engine

Confirmation behaviour (Mariam v2):
  count 1  → LOG_ONLY (notification alert) + audit
  count 2  → PARTIAL BLOCK applied per policy, 60 s auto-lift timer
             If attack returns while partial block is active → escalate to full isolation
  count 3+ → DEVICE_ISOLATE (full)
  Benign   → counter resets; partial block lifts immediately

Fix 1 — RECONNAISSANCE 3-step escalation:
  count 1 → LOG_ONLY
  count 2 → RATE_LIMIT
  count 3 → DEVICE_ISOLATE

Fix 2 — Counter: any non-BENIGN attack increments the counter
  (previously reset when attack type changed)
"""
import time
from datetime import datetime
from .mitigation import AttackClass, MitigationAction, ThreatLevel, CONFIRMATION_THRESHOLD
from .policy import policy_lookup
from .actions import (
    action_log_only, action_rate_limit,
    action_session_rekey, action_device_isolate,
    audit_log, mitigation_is_device_blocked
)
from .aegis_stub import aegis_get_session

PARTIAL_BLOCK_DURATION = 60  # seconds before auto-lift

RECON_ESCALATION = {
    1: MitigationAction.LOG_ONLY,
    2: MitigationAction.RATE_LIMIT,
    3: MitigationAction.DEVICE_ISOLATE,
}


class ConfirmState:
    def __init__(self):
        self.last_attack        = AttackClass.BENIGN
        self.consecutive        = 0
        self.partial_blocked    = False
        self.partial_block_time = 0.0


_confirm_table: dict = {}


def _get_confirm_state(device_id: int) -> ConfirmState:
    if device_id not in _confirm_table:
        _confirm_table[device_id] = ConfirmState()
    return _confirm_table[device_id]


def mitigation_reset_confirmation(device_id: int):
    state = _get_confirm_state(device_id)
    state.consecutive        = 0
    state.last_attack        = AttackClass.BENIGN
    state.partial_blocked    = False
    state.partial_block_time = 0.0


def _apply_partial_block(device_id: int, attack: AttackClass):
    """Apply partial block at count 2 and start 60 s auto-lift timer."""
    cs = _get_confirm_state(device_id)
    action = policy_lookup(attack)
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] PARTIAL_BLOCK - Device {device_id} - attack confirmed twice, applying partial block")

    if action == MitigationAction.RATE_LIMIT:
        action_rate_limit(device_id)
    elif action == MitigationAction.SESSION_REKEY:
        action_session_rekey(device_id)
    elif action == MitigationAction.DEVICE_ISOLATE:
        action_device_isolate(device_id)
    else:
        action_log_only(device_id, attack)

    cs.partial_blocked    = True
    cs.partial_block_time = time.time()
    audit_log(device_id, attack, action)
    print(f"[{ts}] PARTIAL_BLOCK - Device {device_id} - auto-lift scheduled in {PARTIAL_BLOCK_DURATION}s if no further attack")


def _check_partial_block_expiry(device_id: int):
    """Auto-lift partial block after 60 s with no further attack."""
    cs = _get_confirm_state(device_id)
    if cs.partial_blocked:
        elapsed = time.time() - cs.partial_block_time
        if elapsed >= PARTIAL_BLOCK_DURATION:
            cs.partial_blocked    = False
            cs.partial_block_time = 0.0
            session = aegis_get_session(device_id)
            session.notify_threat(ThreatLevel.LOW)
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] PARTIAL_BLOCK_LIFTED - Device {device_id} - 60 s elapsed, no further attack, device restored")


def mitigation_handle_event(device_id: int, attack: AttackClass):
    cs = _get_confirm_state(device_id)

    # check if partial block should auto-lift first
    _check_partial_block_expiry(device_id)

    # Fix 2: counter — any non-BENIGN attack increments; BENIGN resets
    # Mixed-attack sequences (e.g. DDoS → DoS → MQTT) still accumulate the
    # counter because a device switching attack types is *more* suspicious,
    # not less — varied probing indicates active adversarial intent.
    if attack != AttackClass.BENIGN:
        cs.consecutive += 1
        cs.last_attack = attack
    else:
        cs.consecutive = 0
        cs.last_attack = AttackClass.BENIGN
        cs.partial_blocked    = False   # benign traffic lifts the partial block immediately
        cs.partial_block_time = 0.0

    ts = datetime.now().strftime("%H:%M:%S")

    # BENIGN → log and return
    if attack == AttackClass.BENIGN:
        action_log_only(device_id, attack)
        return

    # Fix 1: RECONNAISSANCE 3-step escalation
    if attack == AttackClass.RECONNAISSANCE:
        if cs.consecutive == 1:
            print(f"[{ts}] MITIGATION - Device {device_id} - RECON count 1: watch only")
            action_log_only(device_id, attack)
            audit_log(device_id, attack, MitigationAction.LOG_ONLY)
        elif cs.consecutive == 2:
            print(f"[{ts}] MITIGATION - Device {device_id} - RECON count 2: rate limiting")
            action_rate_limit(device_id)
            audit_log(device_id, attack, MitigationAction.RATE_LIMIT)
        else:
            print(f"[{ts}] ESCALATE - Device {device_id} - RECON count {cs.consecutive}: full isolation")
            action_device_isolate(device_id)
            audit_log(device_id, attack, MitigationAction.DEVICE_ISOLATE)
            cs.consecutive = 0
        return

    # count 1: log + audit, no protective action yet
    if cs.consecutive == 1:
        print(f"[{ts}] MITIGATION - Device {device_id} - first detection, flagged for monitoring ({attack.name})")
        action_log_only(device_id, attack)
        audit_log(device_id, attack, MitigationAction.LOG_ONLY)   # HIPAA: every detection must appear in audit trail
        return

    # count 2: partial block applied
    if cs.consecutive == 2:
        if cs.partial_blocked:
            # already partially blocked and attack returns → escalate immediately
            print(f"[{ts}] ESCALATE - Device {device_id} - attack returned during partial block, escalating to full isolation")
            action_device_isolate(device_id)
            audit_log(device_id, attack, MitigationAction.DEVICE_ISOLATE)
            cs.partial_blocked = False
        else:
            _apply_partial_block(device_id, attack)
        return

    # count 3+: full escalation
    print(f"[{ts}] ESCALATE - Device {device_id} - count {cs.consecutive}, full isolation triggered")
    cs.consecutive = 0
    action_device_isolate(device_id)
    audit_log(device_id, attack, MitigationAction.DEVICE_ISOLATE)
