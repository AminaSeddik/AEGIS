"""mitigation.py — Types, enums, and constants."""
from enum import IntEnum

class AttackClass(IntEnum):
    BENIGN            = 0
    RECONNAISSANCE    = 1
    ICMP_FLOOD        = 2
    ARP_SPOOFING      = 3
    MQTT_ATTACK       = 4
    DOS               = 5
    DDOS              = 6
    RANSOMWARE        = 7
    DATA_EXFILTRATION = 8

class MitigationAction(IntEnum):
    LOG_ONLY       = 0
    RATE_LIMIT     = 1
    SESSION_REKEY  = 2
    DEVICE_ISOLATE = 3

class ThreatLevel(IntEnum):
    LOW      = 0
    HIGH     = 1
    CRITICAL = 2

CONFIRMATION_THRESHOLD = 3
RATE_LIMIT_MAX         = 5
WINDOW_SECONDS         = 1
MAX_BLOCKED_DEVICES    = 256

ATTACK_NAMES = {
    AttackClass.BENIGN:            "Benign",
    AttackClass.RECONNAISSANCE:    "Reconnaissance",
    AttackClass.ICMP_FLOOD:        "ICMP_Flood",
    AttackClass.ARP_SPOOFING:      "ARP_Spoofing",
    AttackClass.MQTT_ATTACK:       "MQTT_Attack",
    AttackClass.DOS:               "DoS",
    AttackClass.DDOS:              "DDoS",
    AttackClass.RANSOMWARE:        "Ransomware",
    AttackClass.DATA_EXFILTRATION: "Data_Exfiltration",
}

ACTION_NAMES = {
    MitigationAction.LOG_ONLY:       "LOG_ONLY",
    MitigationAction.RATE_LIMIT:     "RATE_LIMIT",
    MitigationAction.SESSION_REKEY:  "SESSION_REKEY",
    MitigationAction.DEVICE_ISOLATE: "DEVICE_ISOLATE",
}
