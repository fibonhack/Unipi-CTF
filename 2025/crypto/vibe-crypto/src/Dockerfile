FROM python:3.12-alpine

RUN apk update
RUN apk add socat gcc gmp-dev musl-dev

WORKDIR /app
COPY server.py server.py
COPY flag.txt flag.txt
RUN pip install fastecdsa

ENTRYPOINT ["socat", "-t", "900", "-T", "120", "TCP4-LISTEN:5555,reuseaddr,fork", "EXEC:env PYTHONUNBUFFERED=1 python3 /app/server.py"]