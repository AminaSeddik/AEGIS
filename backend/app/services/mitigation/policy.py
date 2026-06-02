"""policy.py — Attack-to-action policy table. Default-deny (Zero Trust)."""
from .mitigation import AttackClass, MitigationAction

POLICY_TABLE = {
    AttackClass.BENIGN:            MitigationAction.LOG_ONLY,
    AttackClass.RECONNAISSANCE:    MitigationAction.LOG_ONLY,
    AttackClass.ICMP_FLOOD:        MitigationAction.RATE_LIMIT,
    AttackClass.ARP_SPOOFING:      MitigationAction.SESSION_REKEY,
    AttackClass.MQTT_ATTACK:       MitigationAction.SESSION_REKEY,
    AttackClass.DOS:               MitigationAction.RATE_LIMIT,
    AttackClass.DDOS:              MitigationAction.DEVICE_ISOLATE,
    AttackClass.RANSOMWARE:        MitigationAction.DEVICE_ISOLATE,
    AttackClass.DATA_EXFILTRATION: MitigationAction.DEVICE_ISOLATE,
}

def policy_lookup(attack: AttackClass) -> MitigationAction:
    return POLICY_TABLE.get(attack, MitigationAction.RATE_LIMIT)
