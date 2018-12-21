# Use an official Python runtime as a parent image
FROM python:3.6.7


RUN apt-get update && apt-get install -y \
	apt-utils \
	apache2 \
	apache2-dev \
	apache2-utils \
	binutils \
	libproj-dev \
	gdal-bin \
	postgresql-client

#Setting debian testing repo to collect python3.6-dev needed to use mod_wsgi
RUN echo 'deb http://ftp.de.debian.org/debian testing main' >> /etc/apt/sources.list
RUN echo 'APT::Default-Release "stable";' | tee -a /etc/apt/apt.conf.d/00local

RUN apt-get update && apt-get -t testing install -y python3.6-dev
	
# Set the working directory to /var/www/html/
WORKDIR /var/www/html/
ADD requirements.txt /var/www/html/


#RUN pip3 install ptvsd
RUN pip3 install -r requirements.txt

# Since in debian (image base os) mod_wsgi is for python3.5 it's needed to use the one
# from pip
RUN pip3 install mod_wsgi




ADD . /var/www/html/
RUN mv /var/www/html/django_website/settings.py /var/www/html/django_website/settings_old.py
RUN mv /var/www/html/django_website/settings_docker.py /var/www/html/django_website/settings.py
ADD wait-for-postgres.sh /var/www/html/
ADD ./demo_site.conf /etc/apache2/sites-available/inacity.conf
RUN a2dissite 000-default
RUN a2ensite inacity

