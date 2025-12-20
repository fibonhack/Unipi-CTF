# Compiler
CC = gcc

# Compiler flags
CFLAGS = -lm

# Target executable name
TARGET = chall

# Source file
SRC = hex_marks_the_spot.c

# Default rule to build the target
all: $(TARGET)

# Rule to build the target executable
$(TARGET):
	$(CC) -o $(TARGET) $(SRC) $(CFLAGS)

# Rule to clean up generated files
clean:
	rm -f $(TARGET)

release:
	docker build -t chall-builder:local -f ./Build.Dockerfile .
	docker run --rm -v "$(PWD)":/build chall-builder:local

# Phony targets
.PHONY: all clean