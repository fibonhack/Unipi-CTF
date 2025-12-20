import sys

def otp(msg: bytes, key: bytes) -> bytes:
    return bytes([msg[i] ^ key[i % len(key)] for i in range(len(msg))])

def solve():
    try:
        with open("flag_enc.txt", "r") as f:
            enc_hex = f.read().strip()
    except FileNotFoundError:
        print("Error: flag_enc.txt not found.")
        return

    enc = bytes.fromhex(enc_hex)
    key_len = 8
    key = [None] * key_len

    # Known prefix: "unipi{"
    prefix = b"unipi{"
    for i in range(len(prefix)):
        k_idx = i % key_len
        k_val = enc[i] ^ prefix[i]
        if key[k_idx] is not None and key[k_idx] != k_val:
            print(f"Conflict at key index {k_idx} from prefix!")
        key[k_idx] = k_val

    # Known suffix: "}"
    suffix = b"}"
    # The last byte of ciphertext corresponds to the last byte of plaintext
    # enc[-1] ^ key[(len(enc)-1) % 8] = suffix[0]
    last_idx = len(enc) - 1
    k_idx = last_idx % key_len
    k_val = enc[last_idx] ^ suffix[0]
    
    if key[k_idx] is not None:
        if key[k_idx] != k_val:
             print(f"Conflict at key index {k_idx} from suffix! Existing: {key[k_idx]}, New: {k_val}")
    else:
        key[k_idx] = k_val
        print(f"Recovered key[{k_idx}] from suffix.")

    # Check missing bytes
    missing_indices = [i for i, k in enumerate(key) if k is None]
    print(f"Key so far: {key}")
    print(f"Missing key indices: {missing_indices}")

    if len(missing_indices) == 0:
        full_key = bytes(key)
        print(f"Full key recovered: {full_key}")
        print(f"Flag: {otp(enc, full_key).decode(errors='replace')}")
    elif len(missing_indices) == 1:
        idx = missing_indices[0]
        print(f"Brute forcing key byte at index {idx}...")
        for b in range(256):
            key[idx] = b
            candidate_key = bytes(key)
            decrypted = otp(enc, candidate_key)
            try:
                # Filter for printable characters to reduce noise, or just print all
                dec_str = decrypted.decode()
                if dec_str.isprintable():
                     print(f"Key byte {b:02x}: {dec_str}")
            except UnicodeDecodeError:
                pass
    else:
        print("Too many missing key bytes for simple brute force.")

if __name__ == "__main__":
    solve()
