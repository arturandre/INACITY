#!/bin/sh
if test "$#" -ne 1; then
  echo "Usage: $0 filename"
  exit 2
fi

neo4j stop
neo4j-admin load --from="./$1" --database=graph.db --force
neo4j start