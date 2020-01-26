#!/bin/sh
# neo4j_config.sh


neo4j_conf=/etc/neo4j/neo4j.conf

while [ ! -f $neo4j_conf ]
do
  sleep 2 # or less like 0.2
  echo "File $neo4j_conf not found yet."
done
  echo "File $neo4j_conf found!"

# Stopping the neo4j daemon
neo4j stop

# Listening on every ip address (instead of only localhost)
sed -i 's/#dbms.connectors.default_listen_address/dbms.connectors.default_listen_address/g' $neo4j_conf

# Starting the neo4j daemon
neo4j start

# Setting the default user and pass to 'neo4j' and '1234' (without quote marks)
while  ! curl -H "Content-Type: application/json" -XPOST -d '{"password":"1234"}' -u neo4j:neo4j http://localhost:7474/user/neo4j/password 
do
  sleep 2
done

