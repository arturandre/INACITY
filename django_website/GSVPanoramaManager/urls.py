from django.urls import path

from .views import *

app_name = 'gsvpanoramamanager'

urlpatterns = [
    path('getAverageDensityByBoundingBox', getAverageDensityByBoundingBox, name='getAverageDensityByBoundingBox'),
    path('getAverageDensityByAddressList', getAverageDensityByAddressList, name='getAverageDensityByAddressList'),

    path('getFilterResultsByAddressList', getFilterResultsByAddressList, name='getFilterResultsByAddressList'),
    path('getFilterResultsByBoundingBox', getFilterResultsByBoundingBox, name='getFilterResultsByBoundingBox'),

    path('getPanoramasByBoundingBox', getPanoramasByBoundingBox, name='getPanoramasByBoundingBox'),

    path('getPanoramasByAddressList', getPanoramasByAddressList, name='getPanoramasByAddressList'),

    path('insertPanorama', insertPanorama, name='insertPanorama'),
    path('getPanoramaById', getPanoramaById, name='getPanoramaById'),
]