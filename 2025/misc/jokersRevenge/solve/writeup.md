# jokersRevenge Writeup
## Author: marcop
## Category: misc
## Difficulty: Less easy

### Challenge Description
*The Joker did it again! He sneaked back into the bank and plugged the same weird USB device into one of the computers. He also left a note that reads "You will not find my flag this time! I have encrypted it and without the decryption key not even your Batcomputer can help you!". Can you find out what the Joker did on the computer from the USB traffic capture and retrieve the flag?*
___

The challenge consists of a .pcapng file that contains USB traffic exchanged between the Tulip CC and the pc.\
This one is a bit more difficult compared to the previous one: it requires to script the parsing of the USB packets to extract what has been typed and printed on the serial console.

### Solution

Opening the pcap in Wireshark, the first 30 packets all have timestamp 0.00 and can be safely ignored. The serial traffic starts from packet 31.\
All the data is exchanged between host (the pc) and 1.5.2 (the device).

By observing the packets sizes and dissection, we can notice that packets with length >= 28 have a `Leftover Capture Data` field at the end, that starts from byte n. 27.
We can add the filter `frame.len >= 28` in Wireshark to only show these packets.

Looking at the `Leftover Capture Data` only (`w`,`w`,`i`,`i`,`t`,`t`,`h`,``,...), we can see that each payload appears twice, at least in the first packets: once in the host->device direction and once again in the device->host direction.\
This strongly hints to a device that receives inputs data from the host and then sends it back for echoing on the host.

We can edit the filter on Wireshark to only show packets in the device->host direction `frame.len >= 28 && usb.src == "1.5.2" && usb.dst == "host"`.\
Something meaningful starts to appear in the Capture Data field:
`with open('flag.txt')`.`

To exfiltrate all the code, one can either:

- export the packets dissection from Wireshark: add the `Leftover Capture Data` field as column on Wireshark and then export the packet dissections in your preferred format (you might need to convert from hex to ascii)

- script this procedure, i.e. using Python:
```py
import pyshark
capture = pyshark.FileCapture('jokersRevenge.pcapng', display_filter='usb', use_json=True, include_raw=True)

for packet in capture:
    if packet.usb.src == "1.5.2": # check if direction is device to host
        if int(packet.usb.endpoint_address, 16) & 0x80 == 0x80: # check if endpoint is IN
            data = packet.get_raw_packet()[27:]
            print(data.decode(), end='')
print()
capture.close()
```

or from command line:

```bash
tshark -r jokersRevenge.pcapng -Y 'frame.number > 30 && frame.len >= 28 && usb.src=="1.5.2"' -T fields -e usb.capdata
```

- exflitrate by hand: good luck.


The full resulting code is the following:

```
with open('flag.txt') as f:
...     flag = f.read()
...
>>> key = "SUPERSECRETKEY"
>>> ciphertext = ""
>>> for i in range(len(flag)):
...     ciphertext += chr(ord(flag[i])^ord(key[i % len(key)]))
...
>>> import binascii
>>> print(binascii.hexlify(ciphertext.encode()).decode())
263b39353b2821733c622014296a6723631a2b6330310d2e67327006623b0f353e67742d0d70652c2d6e2e
>>>
```

which shows the flag being loaded from a file and being XOR-encrypted with the key `SUPERSECRETKEY`.\

The flag can be retrieve with the following script

```py
import binascii
ciphertext = "263b39353b2821733c622014296a6723631a2b6330310d2e67327006623b0f353e67742d0d70652c2d6e2e"
ct_bytes = binascii.unhexlify(ciphertext.encode())
key = "SUPERSECRETKEY"
flag = ""
for i in range(len(ct_bytes)):
    flag += chr(ct_bytes[i] ^ ord(key[i % len(key)]))
print(flag)
```

(or using CyberChef)

`unipi{d0n't_l34v3_y0ur_k3y5_1n_pl41n_51gh7}`