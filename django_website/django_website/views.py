#from django.template.loader import get_template
#from django.http import HttpResponse
import sys

import requests
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import Http404, HttpResponse, JsonResponse

import json
import datetime
#from django.contrib.gis.geos import GEOSGeometry, Polygon
import geojson
from geojson import Polygon, Feature, FeatureCollection

from django_website.Managers.MapMinerManager import MapMinerManager
from django_website.Managers.ImageMinerManager import ImageMinerManager
from django_website.Managers.ImageFilterManager import ImageFilterManager

from django_website.Primitives import *


########### TESTING ##################
from django.core.files.storage import FileSystemStorage
########### TESTING ##################

##############GLOBALS####################
def __merge_two_dicts(x, y):
    """Given two dicts, merge them into a new dict as a shallow copy."""
    z = x.copy()
    z.update(y)
    return z

__TEMPLATE_GLOBAL_VARS = {'WebsiteName': 'INACITY'}
imageMinerManager = ImageMinerManager()
mapMinerManager = MapMinerManager()
##############GLOBALS####################

def about(request):
    htmlfile = 'about.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

@api_view(['GET'])
def getavailablemapminers(request):
    ret = mapMinerManager.getAvailableMapMinersAndQueries()
    return JsonResponse(ret)

@api_view(['GET'])
def getmapminerfeatures(request):
    mapMinerName = request.GET.get("mapMinerName")
    query = request.GET.get("featureName")
    region = geojson.loads(request.GET.get("regions"))
    
    ret = mapMinerManager.requestQueryToMapMiner(mapMinerName, query, region);
    return JsonResponse(ret)
    #return JsonResponse(geojson.dumps(ret), safe=False)

@api_view(['GET'])
def getimagesforfeaturecollection(request):
    imageMinerName = request.GET.get("imageMinerName")
    featureCollection = geojson.loads(request.GET.get("featureCollection"))
    
    ret = imageMinerManager.getImageForFeatureCollection(imageMinerName, featureCollection);
    return Response(ret)

    
@api_view(['POST'])
def getstreets(request):
    geojsondata = request.data
    geojsonObject = geojson.loads(geojsondata['geojsondata'])

    streetsGeoJson = mapMinerManager.requestQueryToMapMiner('OSMMiner', 'Streets', geojsonObject)
        
    return JsonResponse(geojson.dumps(streetsGeoJson), safe=False)

@api_view(['GET', 'POST'])
def integrationTest(request):
    htmlfile = 'integrationTest.html'
    local_vars = {'sample_key': 'sample_data'}
    if request.method == 'GET':
        return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))
    elif request.method == 'POST':
        jsondata = request.data
        location = jsondata['location']
        imageMinerManager = ImageMinerManager()
        cLoc = location
        d = imageMinerManager.ImageMiners['Google Street View'].getImageFromLocation(cLoc)

        imageFilterManager = ImageFilterManager()
        e = imageFilterManager.ImageFilters['Greenery'].processImage(d)
        png = e.getPNG()
        return HttpResponse(png, content_type='image/png')

def simple_upload(request):
    local_vars = {}
    htmlfile = 'simple_upload.html'
    if request.method == 'POST' and 'myfile' in request.FILES:
        myfile = request.FILES['myfile']
        fs = FileSystemStorage()
        filename = fs.save(myfile.name, myfile)
        uploaded_file_url = fs.url(filename)
        local_vars = {'uploaded_file_url': uploaded_file_url}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

def hello(request):
    
    return HttpResponse("Hello world")

def home(request):
    htmlfile = 'home.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))