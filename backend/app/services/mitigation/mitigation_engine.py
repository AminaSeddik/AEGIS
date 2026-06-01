"""mitigation_engine.py — Main mitigation engine. 3-strike confirmation."""
from .mitigation import AttackClass, MitigationAction, CONFIRMATION_THRESHOLD
from .policy import policy_lookup
from .actions import (
    action_log_only, action_rate_limit, action_session_rekey,
    action_device_isolate, audit_log
)

class ConfirmState:
    def __init__(self):
        self.last_attack  = AttackClass.BENIGN
        self.consecutive  = 0

_confirm_table: dict = {}

def _get_confirm_state(device_id: int) -> ConfirmState:
    if device_id not in _confirm_table:
        _confirm_table[device_id] = ConfirmState()
    return _confirm_table[device_id]

def mitigation_reset_confirmation(device_id: int):
    state = _get_confirm_state(device_id)
    state.consecutive = 0
    state.last_attack  = AttackClass.BENIGN

def mitigation_handle_event(device_id: int, attack: AttackClass):
    cs = _get_confirm_state(device_id)

    if attack == cs.last_attack:
        cs.consecutive += 1
    else:
        cs.last_attack = attack
        cs.consecutive = 1

    if cs.consecutive < CONFIRMATION_THRESHOLD:
        print(f"[MITIGATION] Device {device_id} - confirmation {cs.consecutive}/{CONFIRMATION_THRESHOLD}")
        return

    cs.consecutive = 0
    action = policy_lookup(attack)

    if action == MitigationAction.LOG_ONLY:
        action_log_only(device_id, attack)
    elif action == MitigationAction.RATE_LIMIT:
        action_rate_limit(device_id)
    elif action == MitigationAction.SESSION_REKEY:
        action_session_rekey(device_id)
    elif action == MitigationAction.DEVICE_ISOLATE:
        action_device_isolate(device_id)

    audit_log(device_id, attack, action)
