Let the English alphabet be indexed as (A = 0, B = 1, \dots, Z = 25). Let (F(i)) be the (i)-th Fibonacci number:

[
F(1) = 1, \quad F(2) = 1, \quad F(i) = F(i-1) + F(i-2), \quad i \ge 3.
]

For a character (c_i) at position (i) in a string, define its **encoded character** (c_i') as

[
c_i' \equiv c_i + F(i) \pmod{26},
]

if follows that it can be decoded as

[
c_i \equiv c_i' - F(i) \pmod{26}.
]

Here, (c_i) and (c_i') are treated as integers from 0 to 25 corresponding to letters (A) through (Z).

The encoded string is obtained by applying the encoding to each character:

[
s_{\text{enc}} = (c_1 + F(1), , c_2 + F(2), , \dots, , c_n + F(n)) \pmod{26},
]

and the original string is recovered by

[
s = (c_1' - F(1), , c_2' - F(2), , \dots, , c_n' - F(n)) \pmod{26}.
]

