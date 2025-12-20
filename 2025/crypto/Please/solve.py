#!/usr/bin/env python3
"""
Solve script for RSA Signature Challenge
Exploits the multiplicative homomorphism of RSA:
If sign(m1) = s1 and sign(m2) = s2, then sign(m1 * m2) = s1 * s2 mod n
"""

from pwn import *
from Crypto.Util.number import bytes_to_long, long_to_bytes, inverse
import sys

logging.disable()

def solve_challenge(host=None, port=None):
    # Connect to remote server or local process
    if host and port:
        io = remote(host, port)
    else:
        io = process(['python3', 'src/please.py'])
    
    # Target message to sign
    target_message = b"UniPi CTF"
    target_int = bytes_to_long(target_message)
    
    # Choose two factors: m1 and m2 such that m1 * m2 = target (mod n)
    m1 = 2
    m2 = target_int // 2
    
    # Get the public key (n, e)
    io.sendlineafter(b'Choice: ', b'1')
    io.recvuntil(b'n = ')
    n = int(io.recvline().strip())
    io.recvuntil(b'e = ')
    e = int(io.recvline().strip())
    
    # Adjust m2 to work correctly modulo n
    if m1 * m2 % n != target_int % n:
        m2 = (target_int * inverse(m1, n)) % n
    
    # Request signature for m1
    io.sendlineafter(b'Choice: ', b'2')
    io.sendlineafter(b'hex): ', long_to_bytes(m1).hex().encode())
    io.recvuntil(b'Signature: ')
    sig1 = int(io.recvline().strip().decode(), 16)
    
    # Request signature for m2
    io.sendlineafter(b'Choice: ', b'2')
    io.sendlineafter(b'hex): ', long_to_bytes(m2).hex().encode())
    io.recvuntil(b'Signature: ')
    sig2 = int(io.recvline().strip().decode(), 16)
    
    # Calculate the signature for the target using multiplicative homomorphism
    sig_target = (sig1 * sig2) % n
    sig_target_hex = hex(sig_target)[2:]
    
    # Verify the signature and get the flag
    io.sendlineafter(b'Choice: ', b'3')
    io.sendlineafter(b'hex): ', target_message.hex().encode())
    io.sendlineafter(b'hex): ', sig_target_hex.encode())
    
    # Capture and print the flag
    io.recvuntil(b'Valid signature!')
    
    l = io.recvall(timeout=2).decode()
    print(l)
    exit(0)

if __name__ == "__main__":
    # Usage: python3 health_check.py [host] [port]
    host = "localhost"
    port = 11000
    if len(sys.argv) == 3:
        host = sys.argv[1]
        port = int(sys.argv[2])
    solve_challenge(host, port)