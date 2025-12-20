FROM instancer:latest

WORKDIR /app

# Copy challenge Move sources
COPY src/ /app/challenge/src/

# Set challenge path for runtime compilation
ENV CHALLENGE_PATH=/app/challenge/src

# Inherit all other config from base image (PORT=8080, NODE_ENV=production, etc.)
EXPOSE 8080
CMD ["node", "server.mjs"]
