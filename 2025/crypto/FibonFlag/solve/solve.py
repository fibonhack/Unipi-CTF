import sys

# Tail-recursive Fibonacci
def fibonacci(n, prev=0, curr=1):
    if n == 0:
        return prev
    if n == 1:
        return curr
    return fibonacci(n - 1, curr, prev + curr)

# Alphabet list
alpha = [chr(i) for i in range(ord('a'), ord('z') + 1)]

def num_to_alpha(n):
    return alpha[n % 26]

def alpha_to_num(l):
    return alpha.index(l)


# ---------------------------------------------------
# DECODE: shift BACKWARD by fibonacci(position)
# ---------------------------------------------------
def decode(text):
    result = []

    for i, ch in enumerate(text):
        if ch.lower() in alpha:
            base_index = alpha_to_num(ch.lower())
            shifted = base_index - fibonacci(i)
            new_char = num_to_alpha(shifted)

            # preserve case
            result.append(new_char if ch.islower() else new_char.upper())
        else:
            result.append(ch)

    return "".join(result)


if __name__ == "__main__":
    data = "uojrl{ig_thlgs_fgp_aqal_sh_bbu_uogjqmy}"
    print(decode(data))
