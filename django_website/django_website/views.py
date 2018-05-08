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
from django.contrib.gis.geos import GEOSGeometry, Polygon

from django_website.Managers import *
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

def openLayersLonLatToLatLon(openLayerFeatureCollection: dict):
    """Flips in place longitude and latitude coordinates ordering"""
    type = openLayerFeatureCollection['type']
    if type == 'FeatureCollection':
        features = openLayerFeatureCollection['features']
        for f in features:
            for poly in f['geometry']['coordinates']:
                for c in poly:
                    lon = c[0]
                    c[0] = c[1] #lat -> lon
                    c[1] = lon  #lon -> lat
    else:
        raise NotImplementedError("Collection type not implemented!")
    pass

__TEMPLATE_GLOBAL_VARS = {'WebsiteName': 'INACITY'}
mapMinerManager = MapMinerManager()
##############GLOBALS####################

def about(request):
    htmlfile = 'about.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

@api_view(['POST'])
def getstreets(request):
    if request.method == 'POST':
        jsondata = request.data
        try:
            openLayerFeatureCollection = json.loads(jsondata['jsondata'])

            #OpenLayers use Lon/Lat ordering, so it's necessary to flip the coordinates order
            openLayersLonLatToLatLon(openLayerFeatureCollection);

            pnt = GEOSGeometry(openLayerFeatureCollection['features'][0]['geometry'].__str__())
            streetsDTOList = mapMinerManager.getStreets(Polygon.from_ewkt(pnt.ewkt))
            streetsDTOJsonList = '[' + ",".join(map(lambda x: x.toJSON(), streetsDTOList)) + ']'
            
        except:
            print("Unable to parse GeoJson as GEOSGeometry!");
            print("Error in views.getstreets(): ", sys.exc_info()[0])
    return JsonResponse(streetsDTOJsonList, safe=False)

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