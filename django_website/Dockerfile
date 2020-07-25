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
	default-jre default-jre-headless\
	apt-transport-https ca-certificates
	
#	chromium \

#NEO4J -> default-jre default-jre-headless

#Chrome headless -> gconf-service libasound2 libatk1.0-0 libcairo2 libcups2 libfontconfig1 libgdk-pixbuf2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libxss1 fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
#Ref> https://stackoverflow.com/questions/47203812/package-chromium-browser-has-no-installation-candidate



# install chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install


ADD ./demo_site.conf /etc/apache2/sites-available/inacity.conf
RUN echo "" > /etc/apt/apt.conf.d/00local
