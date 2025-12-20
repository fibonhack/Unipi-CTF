module src::challenge {
    use std::signer;
    use aptos_framework::randomness;

    struct Flag has key {
        is_solved: bool
    }

    fun init_module(deployer: &signer) {
        assert!(signer::address_of(deployer) == @src);
        move_to(deployer, Flag { is_solved: false });
    }

    #[randomness]
    entry fun unlock(_user: &signer, pin: u8) {
        let random_number = randomness::u8_integer() % 1;
        if (random_number == pin) {
            Flag[@src].is_solved = true;
        }
    }

    public entry fun is_solved(admin: &signer) {
        assert!(signer::address_of(admin) == @src);
        assert!(Flag[@src].is_solved);
    }
}
