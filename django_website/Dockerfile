# Use an official Python runtime as a parent image
FROM ubuntu

RUN apt-get update
RUN apt-get install -y apt-utils vim curl apache2 apache2-utils
RUN apt-get -y install python3 libapache2-mod-wsgi-py3
RUN ln /usr/bin/python3 /usr/bin/python
RUN apt-get -y install python3-pip
RUN ln /usr/bin/pip3 /usr/bin/pip
RUN pip install --upgrade pip
RUN pip install django ptvsd
ADD ./demo_site.conf /etc/apache2/sites-available/000-default.conf

# Set the working directory to /var/www/html/
WORKDIR /var/www/html/
ADD requirements.txt /var/www/html/
RUN pip install -r requirements.txt
ADD . /var/www/html/
ADD wait-for-postgres.sh /var/www/html/

RUN apt-get update && apt-get install -y \
	binutils \
	libproj-dev \
	gdal-bin \
	postgresql-client

#EXPOSE 80 3500
#EXPOSE 8000
CMD ["apache2ctl", "-D", "FOREGROUND"]

#RUN mkdir /code











# Server
#EXPOSE 8000
#STOPSIGNAL SIGINT
#ENTRYPOINT ["python", "manage.py"]
#CMD ["runserver", "0:8000"]