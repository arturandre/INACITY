"""
Definition of urls for django_website.
"""

from django.conf.urls import include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

from django_website.views import *

urlpatterns = [
    url(r'^$', home, name='root'),
    url(r'^home/?$', home, name='home'),
    url(r'^about/?$', about, name='about'),
    url(r'^integrationtest/?$', integrationTest, name='integrationtest'),
    url(r'^nexttime/(\d{1,2})/?$', hours_ahead),
    url(r'^simple_upload/?$', simple_upload),
    url(r'^media/.*$', simple_upload),

    #REST API

    # Examples:
    # url(r'^$', django_website.views.home, name='home'),
    # url(r'^django_website/', include('django_website.django_website.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
]
