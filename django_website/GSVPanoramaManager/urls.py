from django.urls import path

from .views import *

app_name = 'gsvpanoramamanager'

urlpatterns = [
    path('getPanoramasByAddressList', getPanoramasByAddressList, name='getPanoramasByAddressList'),
    path('insertPanorama', insertPanorama, name='insertPanorama'),
]