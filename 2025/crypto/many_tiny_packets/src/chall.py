import os

with open("flag.txt", "rb") as f:
    FLAG = f.read().strip()
assert FLAG.startswith(b'unipi{') and FLAG.endswith(b'}')


def otp(msg: bytes, key: bytes) -> bytes:
    return bytes([msg[i] ^ key[i % len(key)] for i in range(len(msg))])

def main():
    key = os.urandom(8)
    enc = otp(FLAG, key)
    print(enc.hex())

if __name__ == '__main__':
    main()