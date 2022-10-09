# INACITY

INACITY (an acronym for INvestigate and Analyze a City) is a platform that aims to combine urban imagery and Computer Vision into a modern Geographic Information System. It was designed to be scalable in the sense that coupling different imaging platforms, GISes databases and Computer Vision filters can be easily done.

# Installation/Deploy

We make available a docker-compose.yml file that can be used to instantiate a docker container to hold INACITY's server and another one to hold the postgreSQL database used by INACITY.

## Pre-requirements:

- A working [docker](https://www.docker.com/) instalation.
- Share ./INACITY/django_website folder with docker's user (assuming one is available) or at least making the folder writable to docker containers.
- Create a copy of the file ./INACITY/**django_website**/**django_website**/settings_secret_template.py (**Notice that you should access the inner 'django_website' folder inside the outer 'django_website'**) at the same folder with the name *settings_secret.py* and fill the fields as requested.

You can get a signing key for Google Street View services [here](https://developers.google.com/maps/documentation/streetview/get-api-key).

## Steps to create and run a new container

On the other hand, if you'd like to manually change some settings (e.g. ports or packages installed), possibly in order to create a new image then you can create a new container by executing the following steps:

1. (**optional**) Edit docker-compose.yml setting up exposed/published ports and/or database name/credentials. Notice that if database settings  are changed then it'll be necessary to make reflect those changes at the file ./INACITY/**django_website**/**django_website**/settings.py as well (look for the variable *DATABASES*).
2. Go to the folder ./INACITY/django_website
3. Run 'docker-compose up'

By default INACITY will be running at [localhost:80](http://localhost:80) and postgreSQL will be exposed at port 25432 to the host machine.

## (OUTDATED DON'T USE IT!) ~Running the saved image from docker-hub~

~If no custom setup is needed, then, after making sure that all the pre-requirements are fulfilled one just need to go to the folder `./INACITY/django_website/` and run the following commands:~

~```~
~1. docker-compose pull~
~2. docker-compose up --no-recreate~
~```~ 

~This will download the last image available of the containers with essential services for the INACITY platform (i.e. redis and postgresql) and the INACITY container already configured.~

### If you're using docker Toolbox then the address for accessing it shall be [192.168.99.100:80](http://192.168.99.100:80) assuming a default setting

For more technical details about how INACITY works, or about deploying a local instance please refer to the [wiki](https://github.com/arturandre/INACITY/wiki).

# Citing INACITY

If you use INACITY in a scientific publication, we would appreciate citations to the following masters's thesis:

Oliveira, A. A. A. M., & Hirata Jr., R.  (2018). INvestigate and Analyse a City - INACITY. Master's Dissertation, Instituto de Matemática e Estatística, University of São Paulo, São Paulo. doi:10.11606/D.45.2018.tde-04052018-170132. Retrieved 2021-07-26, from www.teses.usp.br

and this paper on Software X:

Oliveira, A. A. A. M., & Hirata Jr., R., INACITY - INvestigate and Analyze a CITY, SoftwareX, Volume 15, 2021, 100777, ISSN 2352-7110, https://doi.org/10.1016/j.softx.2021.100777. https://www.sciencedirect.com/science/article/pii/S2352711021000911) Abstract: INACITY is a platform that integrates Geo-located Imagery Databases (GIDs), Geographical Information Systems (GIS), digital maps, and Computer Vision (CV) to collect and analyze urban street-level images. The platform’s software architecture is a client–server model, where the client-side is a simple Web page that allows the user to select regions of a map and select filters to analyze and visualize urban features. The server side is a Django-powered Web service with PostgreSQL and Neo4j databases. Users can select a region of a map, an image filter, and geographical features to analyze relevant urban characteristics as trees, for instance, using the platform. An open-source implementation of the platform is available. The architecture is extensible, and it is easy to add new modules or replace the existing ones with new digital maps, GIS databases, other CV filters, or other GIDs. Keywords: Geographical information system; Geoportal; Computer vision


Bibtex entries:

```
@MastersThesis{oliveirainvestigate,
  title={INvestigate and Analyse a City-INACITY},
  author={Oliveira, Artur Andr{\'e} Almeida de Macedo and Hirata Jr., Roberto},
  Year={2018},
  doi={10.11606/D.45.2018.tde-04052018-170132},
  school={Universidade de S{\~a}o Paulo},
  url={https://teses.usp.br/teses/disponiveis/45/45134/tde-04052018-170132/en.php}
}

@article{ALMEIDADEMACEDOOLIVEIRA2021100777,
title = {INACITY - INvestigate and Analyze a CITY},
journal = {SoftwareX},
volume = {15},
pages = {100777},
year = {2021},
issn = {2352-7110},
doi = {https://doi.org/10.1016/j.softx.2021.100777},
url = {https://www.sciencedirect.com/science/article/pii/S2352711021000911},
author = {Artur André {Almeida de Macedo Oliveira} and Roberto Hirata},
keywords = {Geographical information system, Geoportal, Computer vision},
abstract = {INACITY is a platform that integrates Geo-located Imagery Databases (GIDs), Geographical Information Systems (GIS), digital maps, and Computer Vision (CV) to collect and analyze urban street-level images. The platform’s software architecture is a client–server model, where the client-side is a simple Web page that allows the user to select regions of a map and select filters to analyze and visualize urban features. The server side is a Django-powered Web service with PostgreSQL and Neo4j databases. Users can select a region of a map, an image filter, and geographical features to analyze relevant urban characteristics as trees, for instance, using the platform. An open-source implementation of the platform is available. The architecture is extensible, and it is easy to add new modules or replace the existing ones with new digital maps, GIS databases, other CV filters, or other GIDs.}
}
```
