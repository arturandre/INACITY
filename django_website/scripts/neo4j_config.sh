#!/bin/sh
# neo4j_config.sh

# Starting the neo4j daemon
neo4j start
# Listening on every ip address (instead of only localhost)
sed -i 's/#dbms.connectors.default_listen_address/dbms.connectors.default_listen_address/g' /etc/neo4j/neo4j.conf
# Setting the default user and pass to 'neo4j' and '1234' (without quote marks)
curl -H "Content-Type: application/json" -XPOST -d '{"password":"1234"}' -u neo4j:neo4j http://localhost:7474/user/neo4j/password
