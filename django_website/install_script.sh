#!/bin/sh
# wait-for-postgres.sh

# This fixes the error:
# The value 'stable' is invalid for APT::Default-Release...
# Ref: https://www.linode.com/community/questions/18519/getting-an-error-when-attempting-to-apt-get-install
#echo "APT::Default-Release \"stretch\";" > /etc/apt/apt.conf.d/00local

# Installing necessary packages
apt update
apt install -y apt-utils apt-transport-https ca-certificates apache2 apache2-dev apache2-utils binutils libproj-dev gdal-bin postgresql-client python-pygraphviz graphviz-dev default-jre default-jre-headless

# Neo4j section

wget --no-check-certificate -O - https://debian.neo4j.org/neotechnology.gpg.key | apt-key add -
echo 'deb http://debian.neo4j.org/repo stable/' | tee /etc/apt/sources.list.d/neo4j.list
DEBIAN_FRONTEND=noninteractive

apt update
apt install -y neo4j

neo4j start

#Chrome headless -> gconf-service libasound2 libatk1.0-0 libcairo2 libcups2 libfontconfig1 libgdk-pixbuf2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libxss1 fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
#Ref> https://stackoverflow.com/questions/47203812/package-chromium-browser-has-no-installation-candidate
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -P /tmp/
dpkg -i /tmp/google-chrome-stable_current_amd64.deb; apt-get -fy install

mkdir -p /var/log/inacity
chown root:www-data /var/log/inacity
chmod 775 /var/log/inacity/
touch /var/log/inacity/messages.log
chown root:www-data /var/log/inacity/messages.log
chmod 775 /var/log/inacity/messages.log

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

chmod +x /var/www/html/wait-for-postgres.sh
bash /var/www/html/wait-for-postgres.sh db

python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py collectstatic --noinput
python3 manage.py collectstatic_js_reverse

echo 'from django_website import load; load.run(False)' | python manage.py shell

chmod +x /var/www/html/scripts/*
bash /var/www/html/scripts/daphne_starter.sh

bash /var/www/html/scripts/neo4j_config.sh