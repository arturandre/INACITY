#!/bin/sh
# wait-for-postgres.sh

python -m pip install ptvsd mod_wsgi
python -m pip install -r ./requirements.txt

echo "Copying settings.py.docker to setting.py"
cp -f ./django_website/settings.py.docker ./django_website/settings.py
echo "Copying demo_site.conf to /etc/apache2/sites-available/inacity.conf"
cp /var/www/html/demo_site.conf /etc/apache2/sites-available/inacity.conf
echo "disabling apache 000-default page"
a2dissite 000-default
echo "enabling apache inacity page"
a2ensite inacity
echo "Starting apache (just in case it's stopped"
service apache2 start
echo "Reloading apache"
service apache2 reload
