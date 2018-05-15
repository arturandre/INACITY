(
echo CREATE DATABASE "INACITYdb" WITH OWNER = postgres TEMPLATE = postgis_24_sample ENCODING = 'UTF8' CONNECTION LIMIT = -1;
echo --if "postgis_24_sample" template is not available:
echo -- \connect INACITYdb;
echo --CREATE EXTENSION postgis;
echo \q
) | psql -U postgres

python ..\manage.py migrate django_website

(
echo from django_website import load
echo load.run(False^^^)
) | python ..\manage.py shell