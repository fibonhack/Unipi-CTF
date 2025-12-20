#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <signal.h>
#include <string.h>
#include <stdint.h>
#include <time.h>
#include <sys/mman.h>
#include <math.h>


struct data {
    char user_input[256];
    char flag[128];
} __attribute__((aligned(16)));

// A small helper that performs some arithmetic operations
static inline size_t confuse_math(size_t x) {
    x ^= (x << 3);
    x += (x >> 1) | 0xA5A5A5A5;
    x = (x * 13) ^ (x / 7);
    return x;
}

// Another tiny function to do pointer operations
static void confuse_branch(size_t *p, size_t threshold) {
    if ((*p & 1) == 0) {
        *p = (*p << 1) - ((*p & 0xFF) ^ threshold);
    } else {
        *p = (*p >> 1) + ((*p & 0xFF) | threshold);
    }
    *p = threshold;
}

// Exponentiation that increases entropy
static inline size_t confuse_exponent(size_t x){
    size_t result = 1;
    for (size_t i = 0; i < x; i++) {
        x = x/2 + 1;
        if (result == x){
            return (result^x) + 1;
        }         
    }
    return result;
}

void distribute_address(uintptr_t addr, char *stack, size_t stack_size) {
    size_t fib_prev = 0, fib_curr = 1;
    size_t index = 0;

    // 1) Initialize the RNG and fill with random bytes:
    srand((unsigned int)time(NULL)); // Seed rand
    for (size_t i = 0; i < stack_size; i++) {
        size_t r = (size_t)rand();
        r = confuse_math(r);
        stack[i] = (char)(r & 0xFF);
    }

    // 2) Scatter the address of the treasure
    for (int byte_idx = 0; byte_idx < 8; byte_idx++) {
        // sanity check
        if (index >= stack_size) {
            fprintf(stderr, "Error: Stack size exceeded at byte %d (index=%zu).\n", byte_idx, index);
            return;
        }
        uint8_t actual_byte = (uint8_t)((addr >> (8 * (7 - byte_idx))) & 0xFF);
        stack[index] = (char)actual_byte;

        if ((fib_curr & 1) == 0) {
            size_t tmp = fib_prev;
            confuse_branch(&tmp, fib_prev);
        } else {
            size_t tmp = fib_curr;
            confuse_branch(&tmp, fib_curr);
        }

        size_t next_fib = fib_prev + fib_curr;
        next_fib = pow(next_fib, confuse_exponent(next_fib));

        fib_prev = fib_curr;
        fib_curr = next_fib;

        size_t next_index = index + fib_curr;

        next_index = confuse_math(next_index) % stack_size; 
        next_index = index + fib_curr;

        index = next_index;

    }
}


void* memory_setup(struct data *d, char *env_flag) {
    // Copy the environment flag into the data structure
    size_t env_len = strlen(env_flag);
    if (env_len > 128) env_len = 128;

    size_t map_size = 128;
    int pagesz = getpagesize();

    const uintptr_t MIN_ADDR = 0x40000000;      // start around 1 GiB
    const uintptr_t MAX_ADDR = 0x7FFFFFFF000ULL; // up near the top of 47-bit user­space

    srand((unsigned int)time(NULL) ^ (uintptr_t)&d); 
    void *mapped = NULL;
    while (1) {
        uintptr_t pages_in_range = (MAX_ADDR - MIN_ADDR) / pagesz;
        uintptr_t rnd_page = ( (uintptr_t)rand() % pages_in_range );
        uintptr_t hint = (rnd_page * (uintptr_t)pagesz) + MIN_ADDR;
        hint &= ~(pagesz - 1); // ensure page-aligned

        mapped = mmap((void *)hint,
                      map_size,
                      PROT_READ | PROT_WRITE,
                      MAP_PRIVATE | MAP_ANONYMOUS,
                      -1, 0);
        if (mapped != MAP_FAILED) {
            break; // success: we landed at “mapped”.
        }
        // else, collision. Try again until we succeed.
    }
    
    memcpy(mapped, env_flag, env_len);
    if (env_len < 128) {
        // zero-pad the rest (optional but recommended)
        memset((char *)mapped + env_len, 0, 128 - env_len);
    }

    uintptr_t addr = (uintptr_t)mapped;
    distribute_address(addr, d->flag, sizeof(d->flag));
    addr = 0;

    return mapped;
}


char* read_flag(){
    FILE* f = fopen("/flag.txt", "r");

    if(!f){
        perror("Missing /flag.txt, please contact the challenge author");
        exit(1);
    }

    size_t current = ftell(f);
    fseek(f, 0, SEEK_END);
    size_t flag_size = ftell(f);
    fseek(f, current, SEEK_SET);

    char* flag = malloc(flag_size);

    fread(flag, 1, flag_size, f); 

    return flag;
}

void init() {
    setbuf(stdin, 0);
    setbuf(stdout, 0);
    setbuf(stderr, 0);
}

int main() {
    struct data d;

    init();

    // Initialize the data structure
    memset(&d, 0, sizeof(d));
    
    char *flag = read_flag();
    
    // Setup memory and scatter the address
    void *mapped = memory_setup(&d, flag);
    size_t map_size = 128;

    // Prompt user for input
    printf("Welcome aboard, do you have your map with you? Remember the (he)X marks the spot!:\n");
    printf("Who is asking permission to board the ship?\n");
    fgets(d.user_input, sizeof(d.user_input), stdin);

    printf(d.user_input);

	// prompt user for an address to print with %s
    printf("\nVery well, do you know where the treasure is hidden? (Enter an address in hex format, e.g., 0xdeadbeef):\n");
    char address_input[32];
    if (fgets(address_input, sizeof(address_input), stdin) == NULL) {
        fprintf(stderr, "Error reading input.\n");
        return 1;
    }

    // Convert the user-provided string to an address
    uintptr_t user_address = strtoull(address_input, NULL, 16);
    printf("%s\n", (char *)user_address);

    // free the user input buffer
    memset(address_input, 0, sizeof(address_input));
    munmap(mapped, map_size);

    return 0;
}