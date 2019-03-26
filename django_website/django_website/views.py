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

# To avoid an override of the function logout
# Define an alias for django.contrib.auth.login function using as keyword.
# https://stackoverflow.com/questions/31779234/runtime-error-when-trying-to-logout-django
from django.contrib.auth import logout as django_logout

#Translation & Internationalization
from django.utils import translation

# GSV URL Signing
import hashlib
import hmac
import base64



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
imageFilterManager = ImageFilterManager()
imageProviderManager = ImageProviderManager()
mapMinerManager = MapMinerManager()
userManager = UserManager() 
##############GLOBALS####################

# @TODO: Make the translation call accept POST, store it's session and then translate the page keeping user data unchanged (forms/session)
def lang(request, lang_code):
    user_language = lang_code
    translation.activate(user_language)
    request.session[translation.LANGUAGE_SESSION_KEY] = user_language
    next = request.META.get('HTTP_REFERER')
    if next:
        next = unquote(next)  # HTTP_REFERER may be encoded.
    response = HttpResponseRedirect(next)
    response.set_cookie(
                    settings.LANGUAGE_COOKIE_NAME, lang_code,
                    max_age=settings.LANGUAGE_COOKIE_AGE,
                    path=settings.LANGUAGE_COOKIE_PATH,
                    domain=settings.LANGUAGE_COOKIE_DOMAIN,
                )
    print(lang_code)
    return response


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
            #@TODO: Redirect to user sessions page
            return redirect('home')
    else:
        form = UserCreationForm()
    htmlfile = 'registration/register.html'
    local_vars = {'sample_key': 'sample_data', 'form': form}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

@api_view(['POST'])
def newsession(request):
    """
    End-point to create a new session discarding the current one.
    It does not delete a saved session.

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'POST' request

    Returns
    -------
    HttpResponse with the new sessionId
    """
    request.session['sessionId'] = str(uuid4())
    if request.session.get('uiModelJSON') is not None: del request.session['uiModelJSON']
    #print(f"request.session['sessionId']: {request.session['sessionId']}")
    return HttpResponse(request.session.get('sessionId'), status=200)

@api_view(['POST'])
def getlastsessionid(request):
    """
    End-point to check the last sessionId created.

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'POST' request

    Returns
    -------
    HttpResponse with the last sessionId created or -1
    """
    sessionId = request.session.get('sessionId')
    sessionId = sessionId if sessionId is not None else -1
    return HttpResponse(sessionId, status=200)

# If user is connected then return the session with id = 'currentSessionId' (only if it belongs to the current user)
# If user isn't connected then return the session stored in request.session

@api_view(['POST'])
def loadsession(request):
    """
    End-point to load an user session with its regions,
    layers and images.

    If user is signed in then returns or the
    requested sessionId (if it belongs to the signed in user otherwise
    returns a forbidden message) if the user is not signed in or none
    sessionId is requested then returns the current session.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with a sessionId or empty.

    Returns
    -------
    HttpResponse with a session, forbidden message or empty
    """
    if request.user.is_authenticated:
        try:
            sessionId = request.data.get('sessionId')
            if sessionId is None:
                uiModelJSON = request.session.get('uiModelJSON')
                if uiModelJSON:
                    return JsonResponse(uiModelJSON)
                else:
                    return HttpResponse(status=200)
            session = Session.objects.get(id = sessionId)
            if not isUserSession(request.user, session):
                if request.session.get('sessionId') is not None:
                    request.session['sessionId'] = str(uuid4())
                return forbiddenUserSessionHttpResponse()
            request.session['sessionId'] = sessionId
            request.session['uiModelJSON'] = ast.literal_eval(session.uimodelJSON)
            #print(request.session['uiModelJSON'])
            return JsonResponse(ast.literal_eval(session.uimodelJSON))
        except Session.DoesNotExist:
            uiModelJSON = request.session.get('uiModelJSON')
            if uiModelJSON:
                return JsonResponse(uiModelJSON)
            else:
                return HttpResponse(status=200)
        pass
    else:
        uiModelJSON = request.session.get('uiModelJSON')
        if uiModelJSON:
            return JsonResponse(uiModelJSON)
        else:
            return HttpResponse(status=200)

def forbiddenUserSessionHttpResponse():
    """
    Inner function to return a forbidden message.
    E.g. if the session requested doesn't belong to the
    signed in user.

    Parameters
    ----------
    None

    Returns
    -------
    HttpResponse with status code 401 and message (forbidden).
    """
    return HttpResponse(gettext('This session does not belong to the connected user.', status = 401))

def isUserSession(user, session):
    """
    Inner function to check if a saved session belongs
    to an user.

    Parameters
    ----------
    session : models.Session
        A Session model object
    user : django.contrib.auth.models.User
        Django User object

    Returns
    -------
    True if the session.used_id is the same as the user.id
    """
    if user.is_authenticated:
        return session.user_id == user.id
    return False


@api_view(['POST'])
def savesession(request):
    """
    End-point to save a session with its regions,
    layers and images.

    If user is signed in then the session is saved
    as an user session and can be retrieved in the
    user profile. If the user is not signed then
    the session is saved only as a django session
    and can expire (and consequently be lost).

    Either way the session is always stored at the
    current django session.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with the uiModelJSON object
        in the payload.

    Returns
    -------
    HttpResponse sessionId if it's present, 204 if not and
    400 (bad request) if no uiModelJSON is sent in payload.
    """
    uiModelJSON = request.data.get('uiModelJSON')
    
    if uiModelJSON is None:
        return HttpResponse('No content to be saved!', status = 400)
    sessionName = (uiModelJSON.get('sessionName') or request.session.get('sessionName') or request.session.get('sessionId'))
    print(request.session.get('sessionId'))
    print(f'sessionName: {sessionName}')
    if request.user.is_authenticated:
        sessionId = request.session.get('sessionId')
        print(uiModelJSON.get('sessionName'))
        print(sessionId)
        if sessionId is None:
            session = Session.objects.create(user = request.user, sessionName = sessionName, uimodelJSON = request.data.get('uiModelJSON'))
            session.save()
        else:
            try:
                session = Session.objects.get(id = sessionId)
                if not isUserSession(request.user, session):
                    request.session['sessionId'] = str(uuid4())
                    return forbiddenUserSessionHttpResponse()
                if (sessionName is not None) and (len(sessionName) > 0):
                    session.sessionName = sessionName
                session.uimodelJSON = request.data['uiModelJSON']
                session.save()
            except Session.DoesNotExist:
                session = Session.objects.create(user = request.user, sessionName = sessionName, uimodelJSON = request.data.get('uiModelJSON'))
                session.save()
        request.session['sessionId'] = session.id
    request.session['uiModelJSON'] = request.data['uiModelJSON']
    if request.session.get('sessionId') is not None:
        return HttpResponse(request.session['sessionId'],status=200)
    else:
        return HttpResponse(status=204)


@api_view(['POST'])
def renamesession(request):
    """
    End-point to rename a previously saved user session.

    When the session is automatically saved before the user
    set a name to it, its name will be the uid generated
    by django's framework. So the user can change this name
    in his/her profile page.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with a JSON object
        containing the sessionId of the session 
        to be renamed and the new name.

        E.g.:
        {
            "sessionId": "4594-...",
            "newName": "My neighborhood"
        }

        

    Returns
    -------
    HttpResponse:
    - 204 if the save is done successfully
    - 403 Forbidden if the user has not signed in.
    - 404 if the sessionId does not exists in the database
    """
    if request.user.is_authenticated:
        jsonData = request.data
        sessionId = jsonData['sessionId']
        sessionNewName = jsonData['newName']
        try:
            session = Session.objects.get(id=int(sessionId))
            if not isUserSession(request.user, session):
                return forbiddenUserSessionHttpResponse()
            session.sessionName = sessionNewName
            session.save()
        except Session.DoesNotExist:
            HttpResponse(gettext("This session could not be found. Try saving it first."), status=404)
        pass
    else:
        HttpResponse(gettext("User needs to be logged to rename a session."),  status=403)
    return HttpResponse(status=204)

# Clears session data
@api_view(['POST'])
def clearsession(request):
    """
    End-point to clear the current django session.

    As a side effect a new session with a newly
    generated uid will be created.    

    Parameters
    ----------
    request : HttpRequest
        An empty HTTP 'POST' request 

    Returns
    -------
    HttpResponse:
    - 204 No Content
    """
    request.session['sessionId'] = str(uuid4())
    del request.session['uiModelJSON']
    return HttpResponse(status=204)


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
                  'name': 'Streets'
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

@api_view(['POST'])
def processimagesfromfeaturecollection(request):
    """
    End-point to process images previously collected

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with:
        - Image Filter Id (str)
        - featureCollection (GeoJSON)
            Notice that the featureCollection must have
            GeoImages at the 'properties' property as
            explained in the function 
            'getimagesforfeaturecollection'.
        
        
        E.g.:

        {
            'imageFilterId': 'gsv',
            'featureCollection': <GeoJSON(with GeoImages)>
        }

    Returns
    -------
    JsonResponse: Dict with the keys:
    - 'featureCollection': <GeoJSON> whose GeoImages now
        will contain a new entry (the filter id)
        at the property 'processedDataList' containing the
        result of the processed GeoImage.
    - regionId: (str)
        The region Id of the region that contains the featureCollection 
    - layerId (str)
        The layer inside the region that contains the featureCollection

    """
    jsondata = request.data
    imageFilterId = jsondata['imageFilterId']
    featureCollection = geojson.loads(jsondata['featureCollection'])
    ret = {}
    ret['featureCollection'] = imageFilterManager.processImageFromFeatureCollection(imageFilterId, featureCollection)
    ret['regionId'] = jsondata['regionId']
    ret['layerId'] = jsondata['layerId']
    return JsonResponse(ret, CustomJSONEncoder)

###### OLD TESTING CALLS #################################
@api_view(['POST'])
def getstreets(request):
    geojsondata = request.data
    geojsonObject = geojson.loads(geojsondata['geojsondata'])

    streetsGeoJson = mapMinerManager.requestQueryToMapMiner('OSMMiner', 'Streets', geojsonObject)
        
    return JsonResponse(geojson.dumps(streetsGeoJson), safe=False)

@api_view(['GET', 'POST'])
def integrationTest(request):
    write_to_log('integrationTest')
    htmlfile = 'integrationTest.html'
    local_vars = {'sample_key': 'sample_data'}
    if request.method == 'GET':
        return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))
    elif request.method == 'POST':
        jsondata = request.data
        location = jsondata['location']
        imageProviderManager = ImageProviderManager()
        cLoc = location
        d = imageProviderManager.ImageMiners['Google Street View'].getImageFromLocation(cLoc)

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
    