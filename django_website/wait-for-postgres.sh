#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
shift $(( $# > 0 ? 1 : 0 ))
cmd="$@"

until PGPASSWORD=$POSTGRES_PASS psql -h "$host" -U "postgres" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec $cmd