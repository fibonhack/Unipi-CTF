module src::challenge {
    use std::signer;
    use std::vector;
    use std::string::String;
    struct Challenge has key, copy {
        n: u256,
        e1: u256,
        e2: u256,
        c1: u256,
        c2: u256,
        claimed: bool
    }

    entry fun start_challenge(
        account: &signer,
        n: u256,
        e1: u256,
        e2: u256,
        secret: String
    ) {
        assert!(signer::address_of(account) == @src);
        assert!(!exists<Challenge>(@src));
        assert!(e1 > 1 && e2 > 1);
        assert!(e1 != e2);
        assert!(gcd(e1, e2) == 1);

        let m = bytes_to_long(secret.bytes());

        assert!(m != 0 && m < n);
        assert!(gcd(m, n) == 1);

        let c1 = modexp(m, e1, n);
        let c2 = modexp(m, e2, n);

        move_to(
            account,
            Challenge { n, e1, e2, c1, c2, claimed: false }
        );
    }

    public entry fun claim(message: String) acquires Challenge {
        let ch = borrow_global_mut<Challenge>(@src);
        assert!(!ch.claimed);
        let m = bytes_to_long(message.bytes());
        assert!(m > 0 && m < ch.n);
        let v1 = modexp(m, ch.e1, ch.n);
        let v2 = modexp(m, ch.e2, ch.n);
        assert!(v1 == ch.c1 && v2 == ch.c2);
        ch.claimed = true;
    }

    #[view]
    public fun get_challenge(): Challenge acquires Challenge {
        Challenge[@src]
    }

    inline fun gcd(a: u256, b: u256): u256 {
        let a1 = a;
        let b1 = b;
        while (b1 != 0) {
            let t = a1 % b1;
            a1 = b1;
            b1 = t;
        };
        a1
    }

    inline fun modexp(base: u256, exp: u256, n: u256): u256 {
        let result = 1 % n;
        let base_mod = base % n;
        while (exp > 0) {
            if ((exp & 1) == 1) {
                result = mul_mod(result, base_mod, n);
            };
            base_mod = mul_mod(base_mod, base_mod, n);
            exp >>= 1;
        };
        result
    }

    inline fun mul_mod(a_in: u256, b_in: u256, n: u256): u256 {
        let a = a_in % n;
        let b = b_in;
        let res = 0;
        while (b > 0) {
            if ((b & 1) == 1) {
                res = add_mod(res, a, n);
            };
            a = double_mod(a, n);
            b >>= 1;
        };
        res
    }

    inline fun add_mod(x: u256, y: u256, n: u256): u256 {
        if (x >= n - y) {
            x - (n - y)
        } else {
            (x + y) % n
        }
    }

    inline fun double_mod(x: u256, n: u256): u256 {
        if (x >= n - x) {
            x - (n - x)
        } else {
            (x + x) % n
        }
    }

    inline fun bytes_to_long(bytes: &vector<u8>): u256 {
        let len = bytes.length();
        assert!(len > 0 && len <= 32);
        let i = 0;
        let acc = 0;
        while (i < len) {
            let b = bytes[i];
            acc = (acc << 8) + (b as u256);
            i += 1;
        };
        acc
    }

    inline fun long_to_bytes(x: u256): vector<u8> {
        let x = x;
        let out = vector::empty<u8>();
        while (x > 0) {
            let byte = (x & 0xFF) as u8;
            out.push_back(byte);
            x >>= 8;
        };
        reverse_in_place(&mut out);
        out
    }

    fun reverse_in_place(v: &mut vector<u8>) {
        let i = 0;
        let j = v.length();
        if (j == 0) return;
        j -= 1;
        while (i < j) {
            let a = v[i];
            let b = v[j];
            *v.borrow_mut(i) = b;
            *v.borrow_mut(j) = a;
            i += 1;
            if (j == 0) break;
            j -= 1;
        }
    }

    public entry fun is_solved(admin: &signer) {
        assert!(signer::address_of(admin) == @src);
        assert!(Challenge[@src].claimed);
    }
}
