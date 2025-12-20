#!/bin/bash
set -e

# Stop and remove any existing container
docker stop asr-challenge 2>/dev/null || true
docker rm asr-challenge 2>/dev/null || true

# Run the asr challenge
docker run -d \
  --name asr-challenge \
  -p 8080:8080 \
  -e FLAG="${FLAG:-flag{test_asr}}" \
  -e APTOS_NETWORK="${APTOS_NETWORK:-devnet}" \
  asr-challenge:latest

echo "asr challenge started!"
echo "Access at: http://localhost:8080"
echo "View logs: docker logs -f asr-challenge"
