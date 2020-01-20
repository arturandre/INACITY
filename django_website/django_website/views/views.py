#from django.template.loader import get_template
#from django.http import HttpResponse
import sys

import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import Http404, HttpResponse, JsonResponse, HttpResponseRedirect
from django.utils.translation import gettext
from uuid import uuid4
from urllib.parse import unquote, urlparse

from django_website.Forms.UserForm import ProfileForm, UserForm

import ast
import json
import datetime
#from django.contrib.gis.geos import GEOSGeometry, Polygon
import geojson
from geojson import Polygon, Feature, FeatureCollection
from django_website.Primitives.GeoImage import GeoImage, CustomJSONEncoder

from django_website.Managers.MapMinerManager import MapMinerManager
from django_website.Managers.ImageProviderManager import ImageProviderManager
from django_website.Managers.ImageFilterManager import ImageFilterManager
from django_website.Managers.UserManager import UserManager

from django_website.models import Session
from django.core.exceptions import MultipleObjectsReturned


# General functions
from django.conf import settings
from django_website import settings_secret
from django_website.LogGenerator import write_to_log
from django.shortcuts import render, redirect
from django.template import loader

#User Auth
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required

# To avoid an override of the function logout
# Define an alias for django.contrib.auth.login function using as keyword.
# https://stackoverflow.com/questions/31779234/runtime-error-when-trying-to-logout-django
from django.contrib.auth import logout as django_logout



# GSV URL Signing
import hashlib
import hmac
import base64



########### TESTING ##################
from django.core.files.storage import FileSystemStorage

########### TESTING ##################

##############GLOBALS####################
def __merge_two_dicts(x: dict, y: dict):
    """
    Given two dicts, merge them into a new dict as a shallow copy.
    Notice that the dicts to be merged can't share any key.

    Parameters
    ----------
    x : dict
        A simple dict object
    y : dict
        A simple dict object

    Returns
    -------
    dict object with keys from both initial dict objects
    """
    z = x.copy()
    z.update(y)
    return z

__TEMPLATE_GLOBAL_VARS = {'WebsiteName': 'INACITY'}
imageFilterManager = ImageFilterManager()
imageProviderManager = ImageProviderManager()
mapMinerManager = MapMinerManager()
userManager = UserManager() 
##############GLOBALS####################


def docs(request):
    """
    End-point for the documentation page.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP request.

    Returns
    -------
    none
    """
    return redirect('static/django_website/docs/index.html')


def home(request):
    """
    End-point for the home page.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP request.

    Returns
    -------
    none
    """
    htmlfile = 'home.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

def backend_diag(request):
    """
    End-point for the backend interactive
    diagram page.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP request.

    Returns
    -------
    none
    """
    htmlfile = 'backend_diag.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))


def about(request):
    """
    End-point for the about page.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP request.

    Returns
    -------
    none
    """
    htmlfile = 'about.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

def tutorial(request):
    """
    End-point for the tutorial page.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP request.

    Returns
    -------
    none
    """
    htmlfile = 'tutorial.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

# User Auth
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def users(request):
    """
    End-point for the users login

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP 'POST' request with user data in json format.

    Returns
    -------
    HttpResponse with an echo message.
    """

    retMethod = ''
    jsonData = request.data
    if request.method == 'GET':
        retMethod = ''
    elif  request.method == 'POST':
        userManager.createUser(jsonData)
        retMethod = ''
    elif  request.method == 'PUT':
        retMethod = ''
    elif  request.method == 'DELETE':
        retMethod = ''
    retMethod = request.method

    return HttpResponse(f'Hello Users! {retMethod}')

#ref: https://developers.google.com/maps/documentation/streetview/get-api-key#sample-code-for-url-signing
@api_view(['POST'])
def sign_gsv_url(request):
    """
    Sign a request URL with a URL signing secret.
    
    Parameters
    ----------
    request : HttpRequest
        A basic HTTP 'POST' request with a json in payload with a
        field gsv_unsigned_url with the url to be signed.

        E.g. 
        {
            "gsv_unsigned_url": "https://maps.googleapis.com/maps/api/streetview?size=640..."
        }

    Returns
    -------
    HttpResponse with the signed request URL.
    """
    #write_to_log(f'sign_gsv_url')
    jsonData = request.data
    #write_to_log(json.dumps(jsonData))
    
    
    
    input_url=jsonData['gsv_unsigned_url']
    secret = settings_secret.GSV_SIGNING_SECRET

    if not input_url:
        raise Exception("input_url and secret are required")
    if not secret:
        return HttpResponse(input_url)

    url = urlparse(input_url)

    # We only need to sign the path+query part of the string
    url_to_sign = url.path + "?" + url.query

    # Decode the private key into its binary format
    # We need to decode the URL-encoded private key
    decoded_key = base64.urlsafe_b64decode(secret)

    # Create a signature using the private key and the URL-encoded
    # string using HMAC SHA1. This signature will be binary.
    signature = hmac.new(decoded_key, url_to_sign.encode('utf-8'), hashlib.sha1)

    # Encode the binary signature into base64 for use within a URL
    encoded_signature = base64.urlsafe_b64encode(signature.digest())

    original_url = url.scheme + "://" + url.netloc + url.path + "?" + url.query

    # Return signed URL
    return HttpResponse(original_url + "&signature=" + encoded_signature.decode('utf-8'))

@login_required
@api_view(['GET', 'POST'])
def user_settings(request):
    """
    End-point for the user settings page, containing his/her
    saved settings like API keys and personal data.
    
    Notice that user must be signed in.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP 'GET' request

    Returns
    -------
    The requested page with the user sessions.
    """
    htmlfile = 'registration/user_settings.html'
    
    #if request.user.is_authenticated:
    #    userSessions = Session.objects.filter(user_id=request.user.id).values('id', 'sessionName')
    #    local_vars = {'sessionList': userSessions}
    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=request.user)
        profile_form = ProfileForm(request.POST, instance=request.user.profile)
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            #messages.success(request, _('Your profile was successfully updated!'))
            return redirect('user_settings')
        else:
            #messages.error(request, _('Please correct the error below.'))
            pass
    else:
        user_form = UserForm(instance=request.user)
        profile_form = ProfileForm(instance=request.user.profile)
    local_vars = {
        'user_form': user_form,
        'profile_form': profile_form
        }
    
    #return render(request, 'profiles/profile.html', {
    #    'user_form': user_form,
    #    'profile_form': profile_form
    #})
    return render(
        request,
        htmlfile,
        __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))


@api_view(['GET'])
def profile(request):
    """
    End-point for the user profile page, containing his/her
    saved sessions.
    
    Notice that user must be signed in.

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP 'GET' request

    Returns
    -------
    The requested page with the user sessions.
    """
    htmlfile = 'registration/profile.html'
    local_vars = {'sample_key': 'sample_data'}
    if request.user.is_authenticated:
        userSessions = Session.objects.filter(user_id=request.user.id).values('id', 'sessionName')
        local_vars = {'sessionList': userSessions}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

@api_view(['GET', 'POST'])
def register(request):
    """
    End-point for the user register page.

    If called with a 'GET' HTTP verb returns the rendered page.
    
    If called with a 'POST' HTTP verb must contain a form with
    username and password1 fields

    Parameters
    ----------
    request : HttpRequest
        A basic HTTP 'GET'/'POST' request

    Returns
    -------
    The requested page with the form to be fulfilled or redirect to home
    with the new user signed in.
    """
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    htmlfile = 'registration/register.html'
    local_vars = {'sample_key': 'sample_data', 'form': form}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

def logout(request):
    """
    End-point to sign out an user.

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'GET' request.

    Returns
    -------
    Redirect to the Home page.
    """
    django_logout(request)
    return redirect('home')


@api_view(['GET'])
def getavailablemapminers(request):
    """
    End-point to collect all registered Map Miners.

    To register a Map Miner (e.g. Open Street Map),
    that is, to make it available to clients through
    this endpoint check the MapMinerManager class.

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'GET' request.

    Returns
    -------
    JsonResponse:
      JSONArray with registered map miners.
      e.g.:
      [{
          'id': 'osm',
          'name': 'OpenStreetMap',
          'features': [
              {
                  'id': 'streets',
                  'name': 'Streets',
              }]
          }]
    """
    ret = mapMinerManager.getAvailableMapMinersAndQueries()
    return JsonResponse(ret, safe=False)

@api_view(['GET'])
def getimageproviders(request):
    """
    End-point to collect all registered Image Providers.

    To register an Image Provider (e.g. Google Street View),
    that is, to make it available to clients through
    this endpoint check the ImageProviderManager class.

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'GET' request.

    Returns
    -------
    JsonResponse:
      JSONArray with registered image providers.
      e.g.:
      [{
          'id': 'gsv',
          'name': 'Google Street View'
      }]
    """
    #write_to_log('getimageproviders')
    ret = imageProviderManager.getAvailableImageProviders()
    return JsonResponse(ret, safe=False)

@api_view(['GET'])
def getimagefilters(request):
    """
    End-point to collect all registered Image Filters.

    To register an Image Filter (e.g. Greenery),
    that is, to make it available to clients through
    this endpoint check the ImageFilterManager class.

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'GET' request.

    Returns
    -------
    JsonResponse:
      JSONArray with registered image filters.
      e.g.:
      [{
          'id': 'greenery',
          'name': 'Greenery'
      }]
    """
    ret = imageFilterManager.getAvailableImageFilters()
    return JsonResponse(ret, safe=False)


@api_view(['POST'])
def filtergeoimage(request):
    """
    End-point to apply some registered filter to
    a GeoImage sent as part of the request.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with the filter id (str)
        and a GeoImage (Primitives.GeoImage.GeoImage).

        E.g.:

        {
            'filterId': 'greenery',
            'geoImage': {'id':..., 'data':...}
        }

    Returns
    -------
    JsonResponse: Processed GeoImage
        The dictionary property 'processedDataList' of the
        returned GeoImage will contain a new entry under with
        key equal to the 'filterId' passed in the request.
    """
    jsondata = request.data
    filterId = jsondata["filterId"]
    geoImage = GeoImage.fromJSON(jsondata["geoImage"])
    
    geoImageRet = imageFilterManager.processImage(filterId, geoImage)
    geoImageRet.setDataToBase64()
    return JsonResponse(geoImageRet.toJSON(), safe=False)

@api_view(['POST'])
def getmapminerfeatures(request):
    """
    End-point to retrieve geographical features
    from regions of interest.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with:
        - regions of interest (GeoJSON)
        - Map miner Id (str)
        - Feature Name (str)
        
        E.g.:

        {
            'mapMinerId': 'osm',
            'featureName': 'streets'
            'regions': <GeoJSON>
        }

    Returns
    -------
    JsonResponse: GeoJSON
        The response will be a GeoJSON object
        with the requested feature collected,
        from the Map Miner selected, inside
        the region(s) of interest.
    """
    jsondata = request.data
    mapMinerId = jsondata["mapMinerId"]
    query = jsondata["featureName"]
    region = geojson.loads(jsondata["regions"])
    
    ret = mapMinerManager.requestQueryToMapMiner(mapMinerId, query, region)
    return JsonResponse(ret)

@api_view(['POST'])
def getimagesforfeaturecollection(request):
    """
    End-point to retrieve images for
    urban features previously collected.

    Notice that in order to collect geolocated
    images, some locations are required.

    E.g. When collecting images from a street
    nodes composing the line segments representing
    the street are used as locations and
    the direction from one point to the next
    are used as horizontal angle for the camera.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with:
        - Image miner name (str)
        - featureCollection (GeoJSON)
        
        E.g.:

        {
            'imageMinerName': 'gsv',
            'featureCollection': <GeoJSON>
        }

    Returns
    -------
    JsonResponse: Dict with the keys:
    - 'featureCollection': <GeoJSON> whose its property 'properties'
        will contain a new entry called 'geoImages'. The geoImages
        property will be structured just as the 'features' property
        of the GeoJSON, but rather than coordinates it'll have
        GeoImages as its leaves.
    """
    #write_to_log('getimagesforfeaturecollection')
    jsondata = request.data
    imageMinerName = jsondata['imageMinerName']
    featureCollection = geojson.loads(jsondata['featureCollection'])
    ret = {}
    tryGetImagesForCollection = imageProviderManager.getImageForFeatureCollection(imageMinerName, featureCollection)
    if (isinstance(tryGetImagesForCollection, requests.Response)):
        return HttpResponse(content=tryGetImagesForCollection.content,
            status=tryGetImagesForCollection.status_code,
            content_type=tryGetImagesForCollection.headers['Content-Type'])
    ret['featureCollection'] = imageProviderManager.getImageForFeatureCollection(imageMinerName, featureCollection)
    ret['regionId'] = jsondata['regionId']
    ret['layerId'] = jsondata['layerId']
    return JsonResponse(ret)


###### OLD TESTING CALLS #################################
# @api_view(['POST'])
# def getstreets(request):
#     geojsondata = request.data
#     geojsonObject = geojson.loads(geojsondata['geojsondata'])

#     streetsGeoJson = mapMinerManager.requestQueryToMapMiner('OSMMiner', 'Streets', geojsonObject)
        
#     return JsonResponse(geojson.dumps(streetsGeoJson), safe=False)

# @api_view(['GET', 'POST'])
# def integrationTest(request):
#     write_to_log('integrationTest')
#     htmlfile = 'integrationTest.html'
#     local_vars = {'sample_key': 'sample_data'}
#     if request.method == 'GET':
#         return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))
#     elif request.method == 'POST':
#         jsondata = request.data
#         location = jsondata['location']
#         imageProviderManager = ImageProviderManager()
#         cLoc = location
#         d = imageProviderManager.ImageMiners['Google Street View'].getImageFromLocation(cLoc)

#         imageFilterManager = ImageFilterManager()
#         e = imageFilterManager.ImageFilters['Greenery'].processImage(d)
#         png = e.getPNG()
#         return HttpResponse(png, content_type='image/png')

# def simple_upload(request):
#     local_vars = {}
#     htmlfile = 'simple_upload.html'
#     if request.method == 'POST' and 'myfile' in request.FILES:
#         myfile = request.FILES['myfile']
#         fs = FileSystemStorage()
#         filename = fs.save(myfile.name, myfile)
#         uploaded_file_url = fs.url(filename)
#         local_vars = {'uploaded_file_url': uploaded_file_url}
#     return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

# def hello(request):
#     return HttpResponse("Hello world")
    