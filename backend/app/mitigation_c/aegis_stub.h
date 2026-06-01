#ifndef AEGIS_STUB_H
#define AEGIS_STUB_H

#include <stdint.h>
#include "mitigation.h"

int aegis_stub_get_threat_level(device_id_t device);
int aegis_stub_get_notify_count(device_id_t device);
int aegis_stub_notify_log_size(void);
int aegis_stub_notify_log_at(int idx, uint32_t *out_device, int *out_level);
void aegis_stub_reset(void);

#endif
