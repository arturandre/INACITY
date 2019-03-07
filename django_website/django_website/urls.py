"""
Definition of urls for django_website.
"""

from django.urls import include, re_path, path

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

#from rest_framework.documentation import include_docs_urls

from django_website.views import *
#from django.views.generic.base import TemplateView
from django_website import settings

#from django_website import admin
from django.contrib import admin

#https://docs.djangoproject.com/en/2.0/topics/i18n/translation/#module-django.views.i18n
from django.views.i18n import JavaScriptCatalog

urlpatterns = [
    

    #Internationalization
    re_path(r'^lang/(?P<lang_code>[\w]{2}(-[\w]{2})?)/?$', lang, name='lang'),
    #path('i18n/', include('django.conf.urls.i18n')),
    path('jsi18n/', JavaScriptCatalog.as_view(packages=['django_website']), name='javascript-catalog'),
    
    #Users
    path('accounts/', include('django.contrib.auth.urls')),
    path('accounts/profile/', profile, name='profile'),
    path('accounts/register/', register, name='register'),
    path('logout/', logout, name='logout'),

    #api/session/
    path('api/session/rename/', renamesession, name='renamesession'),
    path('newsession/', newsession, name='newsession'),
    path('clearsession/', clearsession, name='clearsession'),
    path('savesession/', savesession, name='savesession'),
    path('loadsession/', loadsession, name='loadsession'),
    path('getlastsessionid/', getlastsessionid, name='getlastsessionid'),

    #Google Services
    path('sign_gsv_url/', sign_gsv_url, name='sign_gsv_url'),

    # Pages
    re_path(r'^$', home, name='root'),
    re_path(r'^home/?$', home, name='home'),
    re_path(r'^about/?$', about, name='about'),
    re_path(r'^tutorial/?$', tutorial, name='tutorial'),
    re_path(r'^backend_diag/?$', backend_diag, name='backend_diag'),

    # Docs
    #re_path(r'^docs/?$', include_docs_urls(title="INACITY's API")),
    #re_path(r'^docs/', 'django.views.static.serve', {'document_root': settings.DOCS_ROOT, 'path': 'index.html'}),

    # API Calls

    path('users/', users, name='users'),

    #Receives a geoImage and returns its version filtered
    #POST
    re_path(r'^filtergeoimage/?$', filtergeoimage, name='filtergeoimage'),

    #Returns lists of available map miners and their corresponding map features
    re_path(r'^getavailablemapminers/?$', getavailablemapminers, name='getavailablemapminers'),
    
    #Returns a list of available image miners
    re_path(r'^getimageproviders/?$', getimageproviders, name='getImageProviders'),

    #Returns a list of available image filters
    re_path(r'^getimagefilters/?$', getimagefilters, name='getImageFilters'),


    #Get GIS data related to a particular type of feature inside a given region
    re_path(r'^getmapminerfeatures/?$', getmapminerfeatures, name='getmapminerfeatures'),

    #Used to collect images for a given set of GIS features called FeatureCollection
    re_path(r'^getimagesforfeaturecollection/?$', getimagesforfeaturecollection, name='getimagesforfeaturecollection'),

    #Used to process images for a given set of GIS features called FeatureCollection that already has its images collected
    re_path(r'^processimagesfromfeaturecollection/?$', processimagesfromfeaturecollection, name='processimagesfromfeaturecollection'),

    # Testing 
    re_path(r'^integrationtest/?$', integrationTest, name='integrationtest'),



    ######## TESTING ######## 
    re_path(r'^simple_upload/?$', simple_upload),
    re_path(r'^media/.*$', simple_upload),
    ######## TESTING ######## 

#    re_path(r'^home/worker.js', (TemplateView.as_view(
#    template_name="home/worker.js",
#    content_type='application/javascript',
#)), name='worker.js'),

    #REST API

    # Examples:
    # re_path(r'^$', django_website.views.home, name='home'),
    # re_path(r'^django_website/', include('django_website.django_website.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
     #re_path(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
     re_path(r'^admin/', admin.site.urls),
     #re_path(r'^admin/', include(admin.site)),
]
