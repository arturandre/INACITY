#!/bin/sh
if test "$#" -ne 1; then
  echo "Usage: $0 filename"
  exit 2
fi

neo4j stop
neo4j-admin dump --database=graph.db --to="./$1.dump"
neo4j start
