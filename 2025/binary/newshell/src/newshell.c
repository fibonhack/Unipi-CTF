#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char conversion_map[122] = {'?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?',
                            '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?',
                            '?', '?', '_', '=', '*', '%', '$', '!', ';', '#', '(', ')', '@', '-', '\'',
                            ',', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '?', '?', '?',
                            '?', '?', '?', '?', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
                            'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                            '?', '?', '?', '?', '?', '?', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
                            'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
                            'Y', 'Z'};


void sanitize(char* action, int len);

void init(){
    setvbuf(stdin, 0, 2, 0);
    setvbuf(stdout, 0, 2, 0);
}

int main(){
    init();
    int nrequests = 0;
    char action[10];
    size_t size;
    while(nrequests < 4){
        printf("> ");
        fgets(action, sizeof(action), stdin);
        for(int i=0;i<10;i++){
            if(action[i] == '\n') break;
            action[i] = conversion_map[action[i]-1];
        }
        if(!strncmp(action, "exit", 4)){
            exit(0);
        }
        else if(!strncmp(action, "ls", 2)){
            sanitize(action, strlen(action));
            system(action);
        }
        else if(!strncmp(action, "cd", 2)){
            puts("no");
        }else if(!strncmp(action, "cat", 3)){
            puts("no");
        }else{
            exit(1);
        }
        nrequests++;
    }
    return 0;
}

void sanitize(char* action, int len){
    for(int i = 0; i < len; i++){
        char current = action[i];
        if(current == 'x' || current == '.'  || current == 'h' || current == '-' || current == '&' || current == '|'  || current == 'c' || current == 'a' || current == 't' || current == '*' || current == 'v' || current == 'i'){
            action[i] = '!';
        }
    }
}
