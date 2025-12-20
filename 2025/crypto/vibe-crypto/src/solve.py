from fastecdsa.curve import P256
from fastecdsa.point import Point
from fastecdsa.util import mod_sqrt
from hashlib import sha256
from typing import Tuple
import os

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
q = P256.q

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
    points = [((value * c) % P256.q) * B[i] for i, c in enumerate(coeffs)]
    delta = sum(points, Gr * r)
    return comm + delta, coeffs, r

def sign(x: int, message: bytes) -> Tuple[int, int]:
    k = hash_to_scalar(os.urandom(16))
    r = k * Gr
    e = hash_to_scalar(message + (r.x).to_bytes(32, "big") + (r.y).to_bytes(32, "big"))
    s = (k - e * x) % P256.q
    return (s, e)

def verify_signature(comm: Point, message: bytes, sig: Tuple[int, int]):
    (s, e) = sig
    assert 0 <= e < P256.q
    assert 0 <= s < P256.q
    r_v = s * Gr + e * comm
    e_v = hash_to_scalar(message + (r_v.x).to_bytes(32, "big") + (r_v.y).to_bytes(32, "big"))
    return e_v == e


# does signing work?
x = 1234567890
y = x * Gr
m = b"test message"
sig = sign(x, m)
assert verify_signature(y, m, sig)
print("Signature scheme works correctly!")

from pwn import process, context, remote
# context.log_level = "DEBUG"

# io = process(["python3", "server.py"])
io = remote('localhost', 11001)
io.recvuntil(b"Your initial key is: ")
server_initial_key = io.recvline().strip().decode()

initial_comm, target_coeffs, initial_r = add_key(server_initial_key, 1, O, init=True)
execution_digest = update_digest(b"", server_initial_key)

print(f"Your initial key is: {server_initial_key}")

from sage.all import Matrix, GF, vector

print("Building basis matrix...")
basis = []
r = initial_r
for i in range(256):
    comm_, coeffs, r_delta = add_key(f"key_{i}", 0, O)
    r += r_delta
    basis.append(coeffs)

M = Matrix(GF(q), basis).transpose()
b = vector(GF(q), target_coeffs)
print("Solving for secret key values...")
sol = M.solve_right(-b)
print(sol)

comm = initial_comm
r = initial_r
for i in range(256):
    comm, coeffs_, r_delta = add_key(f"key_{i}", int(sol[i]), comm)
    r += r_delta
    r = r % q
    print(f"Added key_{i} with value {int(sol[i])}")
    execution_digest = update_digest(execution_digest, f"key_{i}")
    io.recvuntil(b"Enter command: ")
    io.sendline(b"1")
    io.recvuntil(b"Enter key: ")
    io.sendline(f"key_{i}".encode())
    io.recvuntil(b"Enter value: ")
    io.sendline(str(int(sol[i])).encode())

assert comm == r * Gr

sig = sign(r, execution_digest)
assert verify_signature(comm, execution_digest, sig)

io.recvuntil(b"Enter command: ")
io.sendline(b"2")
io.recvuntil(b"signature (space separated): ")
io.sendline(f"{sig[0]} {sig[1]}".encode())
print(io.recvall().decode())
