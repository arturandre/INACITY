# Use an official Python runtime as a parent image
FROM python:3.6.7

RUN mkdir /code

# Set the working directory to /app
WORKDIR /code

ADD requirements.txt /code/
RUN pip install -r requirements.txt
ADD . /code/
ADD wait-for-postgres.sh /code/

RUN apt-get update && apt-get install -y \
binutils \
libproj-dev \
gdal-bin \
postgresql-client


# Server
#EXPOSE 8000
#STOPSIGNAL SIGINT
#ENTRYPOINT ["python", "manage.py"]
#CMD ["runserver", "0:8000"]