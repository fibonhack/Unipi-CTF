from fastecdsa.curve import P256
from fastecdsa.point import Point
from fastecdsa.util import mod_sqrt
from hashlib import sha256
from typing import Tuple
import os

with open("flag.txt", "r") as f:
    FLAG = f.read().strip()

def hash_to_curve(data: bytes) -> int:
    # perdoname madre por my
    # not constant time hash-to-curve implementation
    h = sha256(data).digest()
    x = int.from_bytes(h, "big") % P256.p
    while True:
        y = mod_sqrt(P256.evaluate(x), P256.p)[0]
        if P256.is_point_on_curve((x, y)):
            return Point(x, y, curve=P256)
        x = (x + 1) % P256.p

def hash_to_scalar(data: bytes) -> int:
    h = sha256(data).digest()
    return int.from_bytes(h, "big") % P256.q

G = P256.G
O = 0 * G
B = [hash_to_curve(f"key_point_{i}".encode()) for i in range(256)]
Gr = hash_to_curve(b"blinding_generator")

def update_digest(digest: bytes, key: str) -> bytes:
    h = sha256()
    h.update(digest)
    h.update(key.encode())
    return h.digest()

def add_key(key: str, value: int, comm: Point, init=False) -> Point:
    assert 0 <= value < P256.q
    r = hash_to_scalar(f"blinding_{key}_{value}".encode())
    coeffs = [
        hash_to_scalar(f"{'init' if init else 'key'}_{key}_{i}".encode()) for i in range(256)
    ]
    points = [value * c * B[i] for i, c in enumerate(coeffs)]
    delta = sum(points, Gr * r)
    return comm + delta

def verify_signature(comm: Point, message: bytes, sig: Tuple[int, int]):
    (s, e) = sig
    assert 0 <= e < P256.q
    assert 0 <= s < P256.q
    r_v = s * Gr + e * comm
    e_v = hash_to_scalar(message + (r_v.x).to_bytes(32, "big") + (r_v.y).to_bytes(32, "big"))
    return e_v == e

def main():
    print("Welcome to the Secure Key-Value Store!")
    print("You can add add objects to the store. But can you get the flag?")
    print("Commands:")
    print("1. Add key")
    print("2. gimme the flag")

    initial_key = os.urandom(16).hex()
    comm = add_key(initial_key, 1, O, init=True)
    execution_digest = update_digest(b"", initial_key)

    print(f"Your initial key is: {initial_key}")

    for _ in range(300):
        command = int(input("Enter command: "))
        if command == 1:
            key = input("Enter key: ")
            value = int(input("Enter value: "))
            comm = add_key(key, value, comm)
            execution_digest = update_digest(execution_digest, key)
        elif command == 2:
            print("To get the flag, provide a valid signature for the current execution.")
            sig_str = input("signature (space separated): ")
            s_str, e_str = sig_str.strip().split()
            s = int(s_str)
            e = int(e_str)
            if verify_signature(comm, execution_digest, (s, e)):
                print(f"Here is your flag: {FLAG}")
                return
            else:
                print("Invalid signature, exiting :(")
                return
        else:
            print("Invalid command")

if __name__ == "__main__":
    main()