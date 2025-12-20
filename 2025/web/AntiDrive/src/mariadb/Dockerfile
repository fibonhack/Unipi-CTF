FROM mariadb:10.4.21

COPY ./00_db_databasoso.sql /docker-entrypoint-initdb.d/
COPY ./10_db.sh /docker-entrypoint-initdb.d/
