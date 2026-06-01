#include "mitigation.h"
#include "aegis_stub.h"
#include <stdio.h>
#include <string.h>

#define MAX_STUB_SESSIONS 512
static aegis_session_t stub_sessions[MAX_STUB_SESSIONS];
static int             stub_session_count = 0;

aegis_session_t *aegis_get_session(device_id_t device) {
    for (int i = 0; i < stub_session_count; i++) {
        if (stub_sessions[i].device == device) return &stub_sessions[i];
    }
    if (stub_session_count < MAX_STUB_SESSIONS) {
        aegis_session_t *s = &stub_sessions[stub_session_count++];
        s->device = device;
        s->last_threat = AEGIS_THREAT_LOW;
        s->notify_call_count = 0;
        return s;
    }
    return NULL;
}

#define MAX_NOTIFY_LOG 2048
typedef struct { device_id_t device; aegis_threat_level_t level; } notify_entry_t;
static notify_entry_t notify_log[MAX_NOTIFY_LOG];
static int            notify_log_count = 0;

void aegis_session_notify_threat(aegis_session_t *session, aegis_threat_level_t level) {
    if (!session) return;
    session->last_threat = level;
    session->notify_call_count++;
    if (notify_log_count < MAX_NOTIFY_LOG) {
        notify_log[notify_log_count].device = session->device;
        notify_log[notify_log_count].level = level;
        notify_log_count++;
    }
}

int aegis_stub_get_threat_level(device_id_t device) {
    for (int i = 0; i < stub_session_count; i++)
        if (stub_sessions[i].device == device) return (int)stub_sessions[i].last_threat;
    return -1;
}

int aegis_stub_get_notify_count(device_id_t device) {
    for (int i = 0; i < stub_session_count; i++)
        if (stub_sessions[i].device == device) return stub_sessions[i].notify_call_count;
    return 0;
}

int aegis_stub_notify_log_size(void) { return notify_log_count; }

int aegis_stub_notify_log_at(int idx, uint32_t *out_device, int *out_level) {
    if (idx < 0 || idx >= notify_log_count) return 0;
    if (out_device) *out_device = (uint32_t)notify_log[idx].device;
    if (out_level)  *out_level  = (int)notify_log[idx].level;
    return 1;
}

void aegis_stub_reset(void) {
    memset(stub_sessions, 0, sizeof(stub_sessions));
    stub_session_count = 0;
    notify_log_count = 0;
}
