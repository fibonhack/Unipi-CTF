// racing_horse_.c

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <stdbool.h>

static const char FLAG[] = "unipi{41w4y5_l00k0u7_f0r_th3_b4ckw4rd_runn1ng_h0r53}";

#define GOAL 50

struct Horse {
    char name[16];  // small name buffer
    int pos;        // current position on track
};


/*
* Layout intentionally chosen so that a negative index into horses[] can
* overwrite the `cheat` field in the same object.
*/
struct Game {
    int cheat;
    char cheat_code[16];
    char useless_padding[40];
    struct Horse horses[10];
};


static struct Game game;

// horse names
static const char *HORSE_NAMES[] = {
    "Thunder",
    "Lightning",
    "Blaze",
    "Shadow",
    "Storm",
    "Comet",
    "Rocket",
    "Flash",
    "Bolt",
    "Dash"
};

void init(void) {
    setbuf(stdin, 0);
    setbuf(stdout, 0);
    setbuf(stderr, 0);

    memset(game.cheat_code, 0, 16);
    for (int i = 0; i < 10; ++i) {
        snprintf(game.horses[i].name, sizeof(game.horses[i].name), HORSE_NAMES[i], i);
        game.horses[i].pos = 0; // start at position 0
    }
    game.cheat = 0; 
}


bool check_cheat_code() {
    const char expected[] = "::D3lb4nE::\00";  // "::En4bl3D::" reversed
    
    for (int i = 0; i < strlen(expected); ++i) {
        if (game.cheat_code[strlen(expected)-i-1] != expected[i]) {
            return false;
        }
    }
    return true;
}

void print_positions(void) {
    int j;
    for (int i = 0; i < 10; ++i) {
        printf("%2d: %-15s |\t\t", i, game.horses[i].name);
        j = 0;
        putchar('|');
        while(j < GOAL){
            if (j < game.horses[i].pos)
                putchar('-');
            else if (j == game.horses[i].pos)
                printf("🐎");
            else
                printf(" ");
            ++j;
        }
        printf("🏁\n");

    }
}


int main(void) {
    srand(time(NULL));
    init();


    puts("Welcome to CTF Race Horse! (pwning exercise)");
    puts("Select your horse by entering a number (0-9). The horse moves by small steps (<10) each turn.");
    printf("Your horse index (max 9): ");


    int choice = 0;
    if (scanf("%d", &choice) != 1) {
        puts("Bad input. Bye.");
        return 1;
    }


    if (choice > 9) {
        puts("Index must be <= 9. Bye.");
        return 1;
    }

    game.horses[choice].pos = 1;
    printf("Do you want to choose a custom name for the Horse? [y/N]: ");
    char c;
    while ((c = getchar()) != '\n' && c != EOF);  // consume leftover newline
    c = getchar();
    if (c == 'y' || c == 'Y'){
        printf("New name: ");
        scanf("%15s", game.horses[choice].name); // note: read 1 byte less to be sure that a null-terminator is added
    }
    printf("You picked horse index: %d\n", choice);
    
    if(choice < 0 || choice > 9) {
        puts("Invalid horse index. Defaulting to horse 0.");
        choice = 0;
    }
        
    strncat(game.horses[choice].name, " (YOU)", sizeof(game.horses[choice].name) - strlen(game.horses[choice].name) - 1);


    printf("Race starts! First to reach %d wins.\n", GOAL);

    int winner = -1;
    while (winner == -1) {
        for (int i = 0; i < 10; ++i) {
            int step;
            if (i == choice && choice >= 0 && choice <= 9) {
                if (game.cheat && check_cheat_code() ) {
                    step = 7 + (rand() % 10);
                } 
                else {
                    step = rand() % 3;
                }
            }
            else {
                step = rand() % 10; 
            }
            
            game.horses[i].pos += step;


            if (game.horses[i].pos >= GOAL) {
                winner = i;
                break;
            }
        }
        if(winner != -1) {
            break;
        }
        // Print intermediate positions
        print_positions();
        sleep(1);
        puts("--- Next turn ---\n");

    }   


    puts("--- Race result ---");
    print_positions();
    printf("Winner: horse %d (%s)\n", winner, game.horses[winner].name);


    if (winner == choice && choice >= 0 && choice <= 9) {
        puts("*** CONGRATULATIONS — your horse won! ***");
        printf("FLAG: %s\n", FLAG);
    } 
    else {
        puts("No flag — the player's horse lost. The game is rigged unless the cheat is triggered.");
    }


    return 0;
}
