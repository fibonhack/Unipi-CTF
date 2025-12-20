#!/bin/bash
set -e

echo "Building instancer golden image..."
cd ../istancer
docker build -t instancer:latest .

echo ""
echo "Building asr challenge image..."
cd ../asr
DOCKER_BUILDKIT=0 docker build -t asr-challenge:latest .

echo ""
echo "Build complete!"
echo "Run with: docker run --rm -p 8080:8080 -e FLAG=flag{your_flag_here} asr-challenge:latest"
