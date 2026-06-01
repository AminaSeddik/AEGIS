#include "mitigation.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

/* ── timestamp helpers ───────────────────────────────────────────── */
static void get_timestamp(char *buf, size_t len)
{
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    strftime(buf, len, "%H:%M:%S", t);
}

static void get_iso_timestamp(char *buf, size_t len)   /* CHANGE 4 */
{
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    strftime(buf, len, "%Y-%m-%dT%H:%M:%S", t);
}

/* ── name tables ─────────────────────────────────────────────────── */
static const char *attack_names[ATTACK_CLASS_COUNT] = {
    [ATTACK_BENIGN]             = "Benign",
    [ATTACK_RECONNAISSANCE]     = "Reconnaissance",
    [ATTACK_ICMP_FLOOD]         = "ICMP_Flood",
    [ATTACK_ARP_SPOOFING]       = "ARP_Spoofing",
    [ATTACK_MQTT_ATTACK]        = "MQTT_Attack",
    [ATTACK_DOS]                = "DoS",
    [ATTACK_DDOS]               = "DDoS",
    [ATTACK_RANSOMWARE]         = "Ransomware",
    [ATTACK_DATA_EXFILTRATION]  = "Data_Exfiltration",
};

static const char *action_names[] = {
    [MITIGATION_LOG_ONLY]       = "LOG_ONLY",
    [MITIGATION_RATE_LIMIT]     = "RATE_LIMIT",
    [MITIGATION_SESSION_REKEY]  = "SESSION_REKEY",
    [MITIGATION_DEVICE_ISOLATE] = "DEVICE_ISOLATE",
};

/* ── blocked list ────────────────────────────────────────────────── */
static device_id_t blocked_devices[MAX_BLOCKED_DEVICES];
static int blocked_count = 0;

int mitigation_is_device_blocked(device_id_t device)
{
    for (int i = 0; i < blocked_count; i++)
        if (blocked_devices[i] == device) return 1;
    return 0;
}

static void block_device(device_id_t device)
{
    if (mitigation_is_device_blocked(device)) return;
    if (blocked_count < MAX_BLOCKED_DEVICES)
        blocked_devices[blocked_count++] = device;
}

/* CHANGE 3: unblock function — operator override after false positive */
int mitigation_unblock_device(device_id_t device)
{
    for (int i = 0; i < blocked_count; i++) {
        if (blocked_devices[i] == device) {
            blocked_devices[i] = blocked_devices[blocked_count - 1];
            blocked_count--;

            aegis_session_t *session = aegis_get_session(device);
            if (session) {
                aegis_session_notify_threat(session, AEGIS_THREAT_LOW);
            }

            char ts[16];
            get_timestamp(ts, sizeof(ts));
            printf("[%s] UNBLOCK - Device %u restored (operator override)\n",
                   ts, device);
            fflush(stdout);
            return 1;
        }
    }
    return 0;
}

/* ── rate limiter ────────────────────────────────────────────────── */
typedef struct {
    device_id_t id;
    time_t timestamps[RATE_LIMIT_MAX + 1];
    int head, count;
} rate_state_t;

static rate_state_t rate_table[MAX_TRACKED_DEVICES];
static int rate_table_size = 0;

static rate_state_t *get_rate_state(device_id_t device)
{
    for (int i = 0; i < rate_table_size; i++)
        if (rate_table[i].id == device) return &rate_table[i];
    if (rate_table_size < MAX_TRACKED_DEVICES) {
        rate_state_t *s = &rate_table[rate_table_size++];
        memset(s, 0, sizeof(*s));
        s->id = device;
        return s;
    }
    return NULL;
}

/* ── action handlers ─────────────────────────────────────────────── */
void action_log_only(device_id_t device, attack_class_t attack)
{
    char ts[16]; get_timestamp(ts, sizeof(ts));
    printf("[%s] Device %u -> %s\n", ts, device,
           attack < ATTACK_CLASS_COUNT ? attack_names[attack] : "Unknown");
}

int action_rate_limit(device_id_t device)
{
    rate_state_t *s = get_rate_state(device);
    if (!s) return 0;
    time_t now = time(NULL);
    int valid = 0;
    for (int i = 0; i < s->count; i++) {
        int idx = (s->head + i) % (RATE_LIMIT_MAX + 1);
        if (now - s->timestamps[idx] < WINDOW_SECONDS) valid++;
    }
    if (valid >= RATE_LIMIT_MAX) {
        char ts[16]; get_timestamp(ts, sizeof(ts));
        printf("[%s] RATE_LIMIT - Device %u packet DROPPED (>%d pkt/s)\n",
               ts, device, RATE_LIMIT_MAX);
        return 0;
    }
    int slot = (s->head + s->count) % (RATE_LIMIT_MAX + 1);
    s->timestamps[slot] = now;
    if (s->count < RATE_LIMIT_MAX + 1) s->count++;
    else s->head = (s->head + 1) % (RATE_LIMIT_MAX + 1);
    return 1;
}

void action_session_rekey(device_id_t device)
{
    char ts[16]; get_timestamp(ts, sizeof(ts));
    aegis_session_t *session = aegis_get_session(device);
    if (session) {
        aegis_session_notify_threat(session, AEGIS_THREAT_HIGH);
        printf("[%s] SESSION_REKEY - Device %u notified AEGIS (THREAT_HIGH)\n",
               ts, device);
    }
}

void action_device_isolate(device_id_t device)
{
    char ts[16]; get_timestamp(ts, sizeof(ts));
    block_device(device);
    aegis_session_t *session = aegis_get_session(device);
    if (session) {
        aegis_session_notify_threat(session, AEGIS_THREAT_CRITICAL);
        printf("[%s] DEVICE_ISOLATE - Device %u blocked + AEGIS (THREAT_CRITICAL)\n",
               ts, device);
    }
}

/* ── CHANGE 4: HIPAA-compliant CSV audit log ─────────────────────── */
static FILE *audit_fp = NULL;

static void ensure_audit_log_open(void)
{
    if (audit_fp != NULL) return;
    audit_fp = fopen("mitigation_audit.log", "a");
    if (!audit_fp) {
        fprintf(stderr, "[MITIGATION] WARNING: cannot open audit log\n");
        audit_fp = stderr;
        return;
    }
    fseek(audit_fp, 0, SEEK_END);
    if (ftell(audit_fp) == 0) {
        fprintf(audit_fp, "timestamp_iso8601,device_id,attack_class,action,outcome\n");
        fflush(audit_fp);
    }
}

void audit_log(device_id_t device, attack_class_t attack,
               mitigation_action_t action)
{
    ensure_audit_log_open();

    char iso[32];
    get_iso_timestamp(iso, sizeof(iso));

    const char *aname  = (attack < ATTACK_CLASS_COUNT)
                         ? attack_names[attack] : "Unknown";
    const char *acname = action_names[action];

    fprintf(audit_fp, "%s,%u,%s,%s,applied\n", iso, device, aname, acname);
    fflush(audit_fp);

    char ts[16];
    get_timestamp(ts, sizeof(ts));
    printf("[%s] AUDIT - Device %u -> %s -> %s\n", ts, device, aname, acname);
    fflush(stdout);
}
