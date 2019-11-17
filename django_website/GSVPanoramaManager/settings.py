from django_website.settings import *

NEO4J_DATABASES = {
    'default' : {
        'HOST':'localhost',
        'PORT':'7687',
        'USER':'neo4j',
        'PASSWORD':'1234'
    }
}

PICTURES_FOLDER = 'pictures/'