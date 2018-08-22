
Installing
**********

Pre-requirements:

* Python 3.6
* Node 8.1

MacOS/Ubuntu
============

1. Download the repository
2. Go to django_website folder and execute:
     * ``pip install -r requirements.txt``
3. Install the GDAL (geographical libs):
    * ``sudo apt-get install binutils libproj-dev gdal-bin``
4. Install python3-tk:
    * ``python3-tk``

Windows
=======

1. Download the repository
2. Go to django_website folder and execute:

    * ``pip install -r requirements.txt``
3. Install `OSGeo4W <https://trac.osgeo.org/osgeo4w/>`_ **64bit**
4. Install `Postgres 9.6.9 <https://www.enterprisedb.com/downloads/postgres-postgresql-downloads>`_

    * 4.1 Add ``C:\Program Files\PostgreSQL\9.6\bin`` to the PATH environment variable
    * 4.2 Add ``C:\OSGeo4W64\bin`` to the PATH environment variable
    * 4.3 Create or update the variable ``OSGEO4W_ROOT`` with the value ``C:\OSGeo4W64``
    * 4.4 Create or update the variable ``GDAL_DATA`` with the value ``%OSGEO4W_ROOT%\share\gdal``
    * 4.5 Create or update the variable ``PROJ_LIB`` with the value ``%OSGEO4W_ROOT%\share\proj``
    * 4.6 Create or update the variable ``PYTHON_ROOT`` with the value ``C:\Python36`` **(that is, the real path to your python install)**
5. Install `PostGIS 2.4.4-1 <https://download.osgeo.org/postgis/windows/pg96/>`_

    * 5.1 Select the option **Create spatial database** 
    * 5.2 Select **YES** to all options
6. Run the following commands at the **Power Shell** (replace **mypassword** for a real password):

    * ``psql -U postgres``
    * ``CREATE USER "INACITYUser" WITH LOGIN CREATEDB CONNECTION LIMIT -1 PASSWORD '**mypassword**';``
    * ``CREATE DATABASE "INACITYdb" WITH OWNER = "INACITYUser" TEMPLATE = postgis_24_sample ENCODING = 'UTF8' CONNECTION LIMIT = -1;``
    * ``CTRL-Z``
    * ``ENTER``
7. Edit the ``settings.py`` file at ``django_website\django_website``

    * 7.1 At the **DATABASES** section insert the correct:
	
        * 7.1.1 **NAME** (i.e. INACITYdb)
        * 7.1.2 **USER** (i.e. INACITYUser)
        * 7.1.3 **PASSWORD** (i.e. mypqssword)
8. Go to the folder ``django_website\`` and the following commands:

    * 8.1 ``python .\manage.py migrate django_website``
    * 8.2 ``python .\manage.py shell``
    * 8.3 ``from django_website import load``
    * 8.4 ``load.run(False)``
    * ``CTRL-Z``
    * ``ENTER``
9. Got to the folder ``INACITY_nodejs\`` and run the following commands:
    * 9.1 ``npm i``
    * 9.2 ``Start-Process "cmd.exe" "/c npm start"``
    * 9.3 Go back to ``django_website\``
    * 9.4 ``Start-Process "cmd.exe" "/c python .\manage.py runserver 0:8000"``