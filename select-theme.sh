#!/bin/sh

source ./sql.login
mysql -B --disable-column-names -h "$SQL_HOST" -u "$SQL_USER" --password="$SQL_PASS" -D"$SQL_DB" -e "SELECT Theme FROM Themes ORDER BY rand() LIMIT 1"

