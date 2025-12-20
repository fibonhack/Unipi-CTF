import pyshark
capture = pyshark.FileCapture('jokersRevenge.pcapng', display_filter='usb', use_json=True, include_raw=True)

for packet in capture:
    if packet.usb.src == "1.5.2": # check if direction is device to host
        if int(packet.usb.endpoint_address, 16) & 0x80 == 0x80: # check if endpoint is IN
            data = packet.get_raw_packet()[27:]
            print(data.decode(), end='')
print()
capture.close()
