# INACITY

INACITY (an acronym for INvestigate and Analyze a City) is a platform that aims to combine urban imagery and Computer Vision into a modern Geographic Information System. It was designed to be scalable in the sense that coupling different imaging platforms, GISes databases and Computer Vision filters can be easily done.

# Installation/Deploy

We make available a docker-compose.yml file that can be used to instantiate a docker container to hold INACITY's server and another one to hold the postgreSQL database used by INACITY.

## Pre-requirements:

- A working [docker](https://www.docker.com/) instalation.
- Share ./INACITY/django_website folder with docker's user (assuming one is available) or at least making the folder writable to docker containers.
- Create a copy of the file ./INACITY/**django_website**/**django_website**/settings_secret_template.py (**Notice that you should access the inner 'django_website' folder inside the outer 'django_website'**) at the same folder with the name *settings_secret.py* and fill the fields as requested.

You can get a signing key for Google Street View services [here](https://developers.google.com/maps/documentation/streetview/get-api-key).

## Steps to create and run the containers


1. (**optional**) Edit docker-compose.yml setting up exposed/published ports and/or database name/credentials. Notice that if database settings  are changed then it'll be necessary to make reflect those changes at the file ./INACITY/**django_website**/**django_website**/settings.py as well (look for the variable *DATABASES*).
2. Go to the folder ./INACITY/django_website
3. Run 'docker-compose up'

By default INACITY will be running at [localhost:80](http://localhost:80) and postgreSQL will be exposed at port 25432 to the host machine.

### If you're using docker Toolbox then the address for accessing it shall be [192.168.99.100:80](http://192.168.99.100:80) assuming a default setting
