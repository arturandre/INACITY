from django.urls import path

from .views import *

app_name = 'gsvpanoramamanager'

urlpatterns = [
#    path('getAverageDensityBy', getAverageDensityByBoundingBox, name='getAverageDensityByBoundingBox'),
#    path('getAverageDensityBy', getAverageDensityByAddress, name='getAverageDensityByAddress'),
#    path('getAverageDensityBy', getAverageDensityByAddressList, name='getAverageDensityByAddressList'),

#    path('getFilterResultsByAddress', getFilterResultsByAddressList, name='getFilterResultsByAddressList'),
#    path('getFilterResultsByAddressList', getFilterResultsByAddressList, name='getFilterResultsByAddressList'),
#    path('getFilterResultsByBoundingBox', getFilterResultsByBoundingBox, name='getFilterResultsByBoundingBox'),

    path('getPanoramasByBoundingBox', getPanoramasByBoundingBox, name='getPanoramasByBoundingBox'),

    path('getPanoramasByAddressList', getPanoramasByAddressList, name='getPanoramasByAddressList'),

    path('insertPanorama', insertPanorama, name='insertPanorama'),
    path('getPanoramaById', getPanoramaById, name='getPanoramaById'),
]