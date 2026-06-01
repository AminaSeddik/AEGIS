#ifndef POLICY_H
#define POLICY_H

#include "mitigation.h"

/* Attack-to-action mapping table */
static const mitigation_action_t policy_table[ATTACK_CLASS_COUNT] = {
    [ATTACK_BENIGN]             = MITIGATION_LOG_ONLY,
    [ATTACK_RECONNAISSANCE]     = MITIGATION_LOG_ONLY,
    [ATTACK_ICMP_FLOOD]         = MITIGATION_RATE_LIMIT,
    [ATTACK_ARP_SPOOFING]       = MITIGATION_SESSION_REKEY,
    [ATTACK_MQTT_ATTACK]        = MITIGATION_SESSION_REKEY,
    [ATTACK_DOS]                = MITIGATION_RATE_LIMIT,
    [ATTACK_DDOS]               = MITIGATION_DEVICE_ISOLATE,
    [ATTACK_RANSOMWARE]         = MITIGATION_DEVICE_ISOLATE,
    [ATTACK_DATA_EXFILTRATION]  = MITIGATION_DEVICE_ISOLATE,
};

static inline mitigation_action_t policy_lookup(attack_class_t attack)
{
    if (attack < 0 || attack >= ATTACK_CLASS_COUNT) {
        return MITIGATION_RATE_LIMIT;   /* CHANGE 2: default-deny (Zero Trust) */
    }
    return policy_table[attack];
}

#endif /* POLICY_H */
