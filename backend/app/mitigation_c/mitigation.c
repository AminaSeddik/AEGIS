#include "mitigation.h"
#include "policy.h"
#include <stdio.h>
#include <string.h>

typedef struct {
    device_id_t id;
    attack_class_t last_attack;
    int consecutive;
} confirm_state_t;

static confirm_state_t confirm_table[MAX_DEVICES];
static int confirm_table_size = 0;

static confirm_state_t *get_confirm_state(device_id_t device)
{
    for (int i = 0; i < confirm_table_size; i++)
        if (confirm_table[i].id == device) return &confirm_table[i];
    if (confirm_table_size < MAX_DEVICES) {
        confirm_state_t *s = &confirm_table[confirm_table_size++];
        memset(s, 0, sizeof(*s));
        s->id = device;
        return s;
    }
    return NULL;
}

void mitigation_reset_confirmation(device_id_t device)
{
    confirm_state_t *s = get_confirm_state(device);
    if (s) { s->consecutive = 0; s->last_attack = ATTACK_BENIGN; }
}

void mitigation_handle_event(device_id_t device, attack_class_t attack)
{
    confirm_state_t *cs = get_confirm_state(device);
    if (!cs) return;

    if (attack == cs->last_attack) cs->consecutive++;
    else { cs->last_attack = attack; cs->consecutive = 1; }

    if (cs->consecutive < CONFIRMATION_THRESHOLD) {
        printf("[MITIGATION] Device %u - confirmation %d/%d\n",
               device, cs->consecutive, CONFIRMATION_THRESHOLD);
        return;
    }
    cs->consecutive = 0;

    mitigation_action_t action = policy_lookup(attack);
    switch (action) {
        case MITIGATION_LOG_ONLY:       action_log_only(device, attack); break;
        case MITIGATION_RATE_LIMIT:     action_rate_limit(device);       break;
        case MITIGATION_SESSION_REKEY:  action_session_rekey(device);    break;
        case MITIGATION_DEVICE_ISOLATE: action_device_isolate(device);   break;
    }
    audit_log(device, attack, action);
}
