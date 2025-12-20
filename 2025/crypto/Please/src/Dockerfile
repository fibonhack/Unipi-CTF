FROM python:slim AS python-crypto
RUN pip install --no-cache-dir pycryptodome

FROM pwn.red/jail

COPY --from=python-crypto / /srv
COPY ./please.py /srv/app/run
COPY ./flag.txt /srv/app/flag.txt
RUN chmod +x /srv/app/run

ENV JAIL_MEM=20M JAIL_TIME=60
ENV JAIL_ENV_PYTHONUNBUFFERED=1 JAIL_ENV_PATH=/usr/local/bin:/usr/bin:/bin