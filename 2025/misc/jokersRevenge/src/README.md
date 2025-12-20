# README

All misc challenges are made with a [Tulip CC](https://tulip.computer/), a self contained computer running Micropython.\
Tulip hardware runs on the ESP32-S3 chip and it can be connected to a pc via a USB cable plugged into the UART port.\
Once the Tulip is plugged in, you can connect to it using `mpremote`, which will open on your terminal the same Python REPL that shows up on the Tulip.\
Data between the pc and the Tulip is exchanged via a serial port.\
When typing, the pc sends data one character at a time, and each character is first printed on the Tulip's screen and then sent back to pc terminal. This explains why each character in the .pcapng file appears twice, once in both direction.

The pcap files are generated with Wireshark/USBPcap1.

The following snippet shows what has been typed on REPL for the second challenge.\

```py
with open('flag.txt') as f:
    flag = f.read()    
key = "SUPERSECRETKEY"
ciphertext = ""
for i in range(len(flag)):
    ciphertext += chr(ord(flag[i])^ord(key[i % len(key)]))    
import binascii
print(binascii.hexlify(ciphertext.encode()).decode())
```