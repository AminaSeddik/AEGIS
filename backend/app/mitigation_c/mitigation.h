#ifndef MITIGATION_H
#define MITIGATION_H

#include <stdint.h>

typedef uint32_t device_id_t;

typedef enum {
    ATTACK_BENIGN = 0,
    ATTACK_RECONNAISSANCE,
    ATTACK_ICMP_FLOOD,
    ATTACK_ARP_SPOOFING,
    ATTACK_MQTT_ATTACK,
    ATTACK_DOS,
    ATTACK_DDOS,
    ATTACK_RANSOMWARE,
    ATTACK_DATA_EXFILTRATION,
    ATTACK_CLASS_COUNT
} attack_class_t;

typedef enum {
    MITIGATION_LOG_ONLY,
    MITIGATION_RATE_LIMIT,
    MITIGATION_SESSION_REKEY,
    MITIGATION_DEVICE_ISOLATE
} mitigation_action_t;

typedef enum {
    AEGIS_THREAT_LOW      = 0,
    AEGIS_THREAT_HIGH     = 1,
    AEGIS_THREAT_CRITICAL = 2
} aegis_threat_level_t;

typedef struct aegis_session {
    device_id_t device;
    aegis_threat_level_t last_threat;
    int notify_call_count;
} aegis_session_t;

#define CONFIRMATION_THRESHOLD 3
#define MAX_BLOCKED_DEVICES 256
#define MAX_TRACKED_DEVICES 512
#define MAX_DEVICES 512
#define RATE_LIMIT_MAX 5
#define WINDOW_SECONDS 1

/* AEGIS API */
aegis_session_t *aegis_get_session(device_id_t device);
void aegis_session_notify_threat(aegis_session_t *session, aegis_threat_level_t level);

/* Mitigation API */
int  mitigation_is_device_blocked(device_id_t device);

/**
 * mitigation_unblock_device()
 * Removes device from blocked list after operator investigation
 * confirms a false positive. Returns 1 if was blocked (now removed),
 * 0 if device was not in the list.
 */
int  mitigation_unblock_device(device_id_t device);   /* CHANGE 3 */

void mitigation_reset_confirmation(device_id_t device);
void mitigation_handle_event(device_id_t device, attack_class_t attack);

/* Action handlers */
void action_log_only(device_id_t device, attack_class_t attack);
int  action_rate_limit(device_id_t device);
void action_session_rekey(device_id_t device);
void action_device_isolate(device_id_t device);
void audit_log(device_id_t device, attack_class_t attack, mitigation_action_t action);

#endif /* MITIGATION_H */
