#!/bin/sh
# wait-for-postgres.sh

echo "" > /etc/apt/apt.conf.d/00local
wget --no-check-certificate -O - https://debian.neo4j.org/neotechnology.gpg.key | apt-key add -
echo 'deb http://debian.neo4j.org/repo stable/' | tee /etc/apt/sources.list.d/neo4j.list
DEBIAN_FRONTEND=noninteractive apt update && apt-get install -y neo4j


python -m pip install ptvsd mod_wsgi
python -m pip install -r ./requirements.txt

echo "Copying demo_site.conf to /etc/apache2/sites-available/inacity.conf"
cp /var/www/html/demo_site.conf /etc/apache2/sites-available/inacity.conf
echo "disabling apache 000-default page"
a2dissite 000-default
echo "enabling apache inacity page"
a2ensite inacity
echo "Starting apache (just in case it's stopped)"
service apache2 start
echo "Reloading apache"
service apache2 reload
