#include "aegis_ascon_api.h"
#include "ascon.h"
#include <string.h>

int aegis_encrypt(uint8_t* out, size_t* out_len,
                  const uint8_t* plaintext, size_t pt_len,
                  const uint8_t* ad, size_t ad_len,
                  const uint8_t* nonce,
                  const uint8_t* key)
{
    if (!out || !out_len || !nonce || !key) return -1;
    if (pt_len > 0 && !plaintext) return -1;
    if (ad_len > 0 && !ad) return -1;
    uint8_t tag[ASCON_TAG_LEN];
    int ret = ascon_aead_encrypt(tag, out, plaintext, (uint64_t)pt_len,
                                 ad, (uint64_t)ad_len, nonce, key);
    if (ret != 0) return -1;
    memcpy(out + pt_len, tag, ASCON_TAG_LEN);
    *out_len = pt_len + ASCON_TAG_LEN;
    return 0;
}

int aegis_decrypt(uint8_t* out, size_t* out_len,
                  const uint8_t* ciphertext, size_t ct_len,
                  const uint8_t* ad, size_t ad_len,
                  const uint8_t* nonce,
                  const uint8_t* key)
{
    if (!out || !out_len || !ciphertext || !nonce || !key) return -1;
    if (ct_len < ASCON_TAG_LEN) return -1;
    size_t c_len = ct_len - ASCON_TAG_LEN;
    const uint8_t* tag = ciphertext + c_len;
    int ret = ascon_aead_decrypt(out, tag, ciphertext, (uint64_t)c_len,
                                 ad, (uint64_t)ad_len, nonce, key);
    if (ret != 0) {
        memset(out, 0, c_len);
        return -1;
    }
    *out_len = c_len;
    return 0;
}
