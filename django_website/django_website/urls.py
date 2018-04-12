"""
Definition of urls for django_website.
"""

from django.conf.urls import include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

from django_website.views import hello

urlpatterns = [
    url(r'^hello$', hello),
    url(r'^$', hello, name='hello'),
    # Examples:
    # url(r'^$', django_website.views.home, name='home'),
    # url(r'^django_website/', include('django_website.django_website.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
]
