"""
Definition of urls for django_website.
"""

from django.conf.urls import include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

#from rest_framework.documentation import include_docs_urls

from django_website.views import *
#from django.views.generic.base import TemplateView
from django_website import settings

urlpatterns = [
    # Pages
    url(r'^$', home, name='root'),
    url(r'^home/?$', home, name='home'),
    url(r'^about/?$', about, name='about'),
    url(r'^tutorial/?$', tutorial, name='tutorial'),

    # Docs
    #url(r'^docs/?$', include_docs_urls(title="INACITY's API")),
    url(r'^docs/(?P<path>.*)$', docs, name='docs'),
    #url(r'^docs/', 'django.views.static.serve', {'document_root': settings.DOCS_ROOT, 'path': 'index.html'}),

    # API Calls
    #Returns lists of available map miners and their corresponding map features
    url(r'^getavailablemapminers/?$', getavailablemapminers, name='getavailablemapminers'),
    
    #Returns a list of available image miners
    url(r'^getimageproviders/?$', getimageproviders, name='getImageProviders'),

    #Get GIS data related to a particular type of feature inside a given region
    url(r'^getmapminerfeatures/?$', getmapminerfeatures, name='getmapminerfeatures'),

    #Used to collect images for a given set of GIS features called FeatureCollection
    url(r'^getimagesforfeaturecollection/?$', getimagesforfeaturecollection, name='getimagesforfeaturecollection'),

    # Testing 
    url(r'^integrationtest/?$', integrationTest, name='integrationtest'),



    ######## TESTING ######## 
    url(r'^simple_upload/?$', simple_upload),
    url(r'^media/.*$', simple_upload),
    ######## TESTING ######## 

#    url(r'^home/worker.js', (TemplateView.as_view(
#    template_name="home/worker.js",
#    content_type='application/javascript',
#)), name='worker.js'),

    #REST API

    # Examples:
    # url(r'^$', django_website.views.home, name='home'),
    # url(r'^django_website/', include('django_website.django_website.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
]
