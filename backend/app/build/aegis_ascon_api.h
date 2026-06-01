#ifndef AEGIS_ASCON_API_H
#define AEGIS_ASCON_API_H
#include <stdint.h>
#include <stddef.h>

#define ASCON_KEY_LEN   16
#define ASCON_NONCE_LEN 16
#define ASCON_TAG_LEN   16

int aegis_encrypt(uint8_t* out, size_t* out_len,
                  const uint8_t* plaintext, size_t pt_len,
                  const uint8_t* ad, size_t ad_len,
                  const uint8_t* nonce,
                  const uint8_t* key);

int aegis_decrypt(uint8_t* out, size_t* out_len,
                  const uint8_t* ciphertext, size_t ct_len,
                  const uint8_t* ad, size_t ad_len,
                  const uint8_t* nonce,
                  const uint8_t* key);
#endif
