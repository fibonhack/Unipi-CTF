#!/usr/bin/env python3

from Crypto.PublicKey import RSA
from Crypto.Util.number import bytes_to_long, long_to_bytes
import os

# Genera chiavi RSA
key = RSA.generate(2048)
n = key.n
e = key.e
d = key.d

TARGET_MESSAGE = b"UniPi CTF"

def sign_message(message):
    """Sign a message with RSA, but refuse to sign the target"""
    if message == TARGET_MESSAGE:
        return None
    
    m = bytes_to_long(message)
    signature = pow(m, d, n)
    return signature

def verify_signature(message, signature):
    """Verify an RSA signature"""
    m = bytes_to_long(message)
    decrypted = pow(signature, e, n)
    return decrypted == m

def print_menu():
    print("\n" + "="*50)
    print("RSA Signature Oracle")
    print("="*50)
    print("1. Get the public key")
    print("2. Sign a message")
    print("3. Verify a signature")
    print("4. Exit")
    print("="*50)

def main():
    print("""
========================================
          PLEASE: 
            Provide
            Legal
            Exculpation
            And
            Sign
            Everything
========================================
        """)
    print("Welcome to the RSA Signature Challenge!")
    print(f"Objective: Get a valid signature for '{TARGET_MESSAGE.decode()}'")
    
    while True:
        print_menu()
        choice = input("\nChoice: ").strip()
        
        if choice == "1":
            print(f"\nPublic key:")
            print(f"n = {n}")
            print(f"e = {e}")
        
        elif choice == "2":
            message = input("Enter the message to sign (hex): ").strip()
            try:
                msg_bytes = bytes.fromhex(message)
                
                if len(msg_bytes) > 200:
                    print("Error: Message too long!")
                    continue
                
                signature = sign_message(msg_bytes)
                
                if signature is None:
                    print(f"Error: I cannot sign '{TARGET_MESSAGE.decode()}'!")
                else:
                    print(f"\nSignature: {hex(signature)}")
            
            except ValueError:
                print("Error: Invalid hex format!")
        
        elif choice == "3":
            message = input("Enter the message (hex): ").strip()
            signature = input("Enter the signature (hex): ").strip()
            
            try:
                msg_bytes = bytes.fromhex(message)
                sig_int = int(signature, 16)
                
                if verify_signature(msg_bytes, sig_int):
                    print("\n✓ Valid signature!")
                    
                    if msg_bytes == TARGET_MESSAGE:
                        print("\n" + "="*50)
                        print("CONGRATULATIONS! You solved the challenge!")
                        print("="*50)
                        
                        # Read the flag from file
                        try:
                            with open("flag.txt", "r") as f:
                                flag = f.read().strip()
                            print(f"\nFlag: {flag}")
                        except FileNotFoundError:
                            print("\n Flag missing: contact the administrator.")
                        
                        return
                else:
                    print("\n✗ Invalid signature!")
            
            except ValueError:
                print("Error: Invalid format!")
        
        elif choice == "4":
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice!")

if __name__ == "__main__":
    main()