#!/bin/sh
set -e

mysql -u root -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" <<-EOSQL
    INSERT INTO \`file\` VALUES ("flag.txt", 1, '$FLAG');
EOSQL
