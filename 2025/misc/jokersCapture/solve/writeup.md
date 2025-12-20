# jokersCapture Writeup
## Author: marcop
## Category: misc
## Difficulty: Easy

### Challenge Description
*The CCTV of Gotham City International Bank have spotted the Joker plugging a weird device into one of the computers and then doing some suspicious stuff. We don't know what that device was and the police was too late to capture him, but luckily we managed to capture the USB traffic exchanged between the device and the pc. Can you help Batman find the Joker's flag?*
___
The challenge consists of a .pcapng file that contains USB traffic exchanged between the Tulip CC and the pc.

It is supposed to be very easily solvable for someone who has no prior experience in scripting or analyzing pcap files.

### Solution
It can be solved by just **opening the file with Wireshark and scrolling down to around half of it**, where the flag will appear character by character in the Info column.\
There is no need to actually retrieve what has been typed on REPL (so far. It will be necessary in the next challenges).\
Alternatively, one can use the following bash one-liner to print the flag

```bash
(tshark -r jokersCapture.pcapng -Y 'usb.src=="1.5.2"' -T fields -e _ws.col.Info | grep Command | awk '{print $6
}';) | tr -d '\n'
```

- `-r` read from file
- `-Y` display filter, only print packets where USB source address is `1.5.2`
- `-T fields -e _ws.col.Info` print the `Info` field

So far the output would be something like

```
[...snip...]
URB_BULK out
URB_BULK in
URB_BULK out
URB_BULK in, Rcvd AT Command:   ...
URB_BULK out
URB_BULK in
URB_BULK out
URB_BULK in, Rcvd AT Command:   u
URB_BULK in, Rcvd AT Command:   n
URB_BULK in, Rcvd AT Command:   i
URB_BULK in, Rcvd AT Command:   p
URB_BULK in, Rcvd AT Command:   i
[...snip...]
```

All the rest is just bash-fu to pretty print the flag.