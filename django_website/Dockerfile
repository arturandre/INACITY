# Use an official Python runtime as a parent image
FROM python:3.6.7


RUN apt update && apt-get install -y \
	apt-utils \
	apache2 \
	apache2-dev \
	apache2-utils \
	binutils \
	libproj-dev \
	gdal-bin \
	postgresql-client \
	python-pygraphviz \
	chromium \
	default-jre default-jre-headless

#NEO4J -> default-jre default-jre-headless

#Chrome headless -> gconf-service libasound2 libatk1.0-0 libcairo2 libcups2 libfontconfig1 libgdk-pixbuf2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libxss1 fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
#Ref> https://stackoverflow.com/questions/47203812/package-chromium-browser-has-no-installation-candidate



# install chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
#&& apt-get install -y python3.6-dev
	
# Set the working directory to /var/www/html/
#WORKDIR /var/www/html/


#ADD requirements.txt /var/www/html/


#RUN pip3 install ptvsd
#RUN pip3 install -r requirements.txt

# Since in debian (image base os) mod_wsgi is for python3.5 it's needed to use the one
# from pip
#RUN pip3 install mod_wsgi




#ADD . /var/www/html/

#RUN mv /var/www/html/django_website/settings.py /var/www/html/django_website/settings_old.py
#RUN mv /var/www/html/django_website/settings_docker.py /var/www/html/django_website/settings.py
#ADD ./wait-for-postgres.sh /var/www/html/

ADD ./demo_site.conf /etc/apache2/sites-available/inacity.conf
RUN echo "" > /etc/apt/apt.conf.d/00local
#RUN a2dissite 000-default
#RUN a2ensite inacity

