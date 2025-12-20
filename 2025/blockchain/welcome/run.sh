#!/bin/bash
set -e

# Stop and remove any existing container
docker stop welcome-challenge 2>/dev/null || true
docker rm welcome-challenge 2>/dev/null || true

# Run the welcome challenge
docker run -d \
  --name welcome-challenge \
  -p 8080:8080 \
  -e FLAG="${FLAG:-flag{test_welcome}}" \
  -e APTOS_NETWORK="${APTOS_NETWORK:-devnet}" \
  welcome-challenge:latest

echo "Welcome challenge started!"
echo "Access at: http://localhost:8080"
echo "View logs: docker logs -f welcome-challenge"
