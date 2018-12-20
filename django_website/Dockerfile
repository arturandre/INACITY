# Use an official Python runtime as a parent image
FROM python:3.6.7

#RUN mkdir /code

# Set the working directory to /app
#WORKDIR /code

#ADD requirements.txt /code/
#RUN pip3 install -r requirements.txt

RUN apt-get update && apt-get install -y \
	apt-utils \
	apache2 \
	apache2-utils \
	libapache2-mod-wsgi-py3 \
	binutils \
	libproj-dev \
	gdal-bin \
	postgresql-client

ADD ./demo_site.conf /etc/apache2/sites-available/000-default.conf

# Set the working directory to /var/www/html/
WORKDIR /var/www/html/
ADD requirements.txt /var/www/html/

#RUN pip3 install ptvsd
RUN pip3 install -r requirements.txt
ADD . /var/www/html/
RUN mv /var/www/html/django_website/settings.py /var/www/html/django_website/settings_old.py
RUN mv /var/www/html/django_website/settings_docker.py /var/www/html/django_website/settings.py
ADD wait-for-postgres.sh /var/www/html/

#For apache webserver (If django is intented comment the line below)
#Running Apache2 server in foreground so it stays open
#ENTRYPOINT ["apache2ctl", "-D", "FOREGROUND"]
#CMD ["/var/www/html/wait-for-postgres.sh", "db"]
#CMD ["apache2ctl", "-D", "FOREGROUND"]


# Server
#EXPOSE 8000
#STOPSIGNAL SIGINT
#ENTRYPOINT ["python", "manage.py"]
#CMD ["runserver", "0:8000"]