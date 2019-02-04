#from django.template.loader import get_template
#from django.http import HttpResponse
import sys

import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import Http404, HttpResponse, JsonResponse, HttpResponseRedirect
from urllib.parse import unquote


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


def about(request):
    htmlfile = 'about.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

def tutorial(request):
    htmlfile = 'tutorial.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

# User Auth
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def users(request):
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

@api_view(['GET'])
def profile(request):
    htmlfile = 'registration/profile.html'
    local_vars = {'sample_key': 'sample_data'}
    if request.user.is_authenticated:
        #cookieSessionName = request.COOKIES['sessionid']
        userSessions = Session.objects.filter(user_id=request.user.id).values('id', 'sessionName')
        #local_vars = {'sessionList': userSessions, 'cookieSessionName': cookieSessionName}
        local_vars = {'sessionList': userSessions}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))

@api_view(['GET', 'POST'])
def register(request):
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
    if request.session.get('sessionId') is not None: del request.session['sessionId']
    if request.session.get('uiModelJSON') is not None: del request.session['uiModelJSON']
    return HttpResponse(status=200)

@api_view(['POST'])
def getlastsessionid(request):
    sessionId = request.session.get('sessionId')
    sessionId = sessionId if sessionId is not None else -1
    return HttpResponse(sessionId, status=200)

# If user is connected then return the session with id = 'currentSessionId' (only if it belongs to the current user)
# If user isn't connected then return the session stored in request.session

@api_view(['POST'])
def loadsession(request):
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
                if request.session['sessionId'] is not None:
                    del request.session['sessionId']
                return forbiddenUserSessionHttpResponse()
            request.session['sessionId'] = sessionId
            request.session['uiModelJSON'] = ast.literal_eval(session.uimodelJSON)
            print(request.session['uiModelJSON'])
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
    return HttpResponse(gettext('This session does not belong to the connected user.', status = 401))

def isUserSession(user, session):
    if user.is_authenticated:
        return session.user_id == user.id
    return False


@api_view(['POST'])
def savesession(request):
    uiModelJSON = request.data.get('uiModelJSON')
    
    if uiModelJSON is None:
        return HttpResponse('No content to be saved!', status = 400)
    sessionName = (uiModelJSON.get('sessionName') or request.session.get('sessionName') or request.COOKIES.get('sessionid'))
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
                    del request.session['sessionId']
                    return forbiddenUserSessionHttpResponse()
                if (sessionName is not None) and (len(sessionName) > 0):
                    session.sessionName = sessionName
                session.uimodelJSON = request.data['uiModelJSON']
                session.save()
            except Session.DoesNotExist:
                #sessionName = request.data.get('sessionName') or request.COOKIES.get('sessionid')
                session = Session.objects.create(user = request.user, sessionName = sessionName, uimodelJSON = request.data.get('uiModelJSON'))
                session.save()
        request.session['sessionId'] = session.id
    request.session['uiModelJSON'] = request.data['uiModelJSON']
    if request.session.get('sessionId') is not None:
        return HttpResponse(request.session['sessionId'],status=200)
    else:
        return HttpResponse(status=204)

from django.utils.translation import gettext

@api_view(['POST'])
def renamesession(request):
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
    del request.session['uiModelJSON']
    return HttpResponse(status=204)


def logout(request):
    django_logout(request)
    return redirect('home')


@api_view(['GET'])
def getavailablemapminers(request):
    ret = mapMinerManager.getAvailableMapMinersAndQueries()
    return JsonResponse(ret)

@api_view(['GET'])
def getimageproviders(request):
    ret = imageProviderManager.getAvailableImageProviders()
    return JsonResponse(ret)

@api_view(['GET'])
def getimagefilters(request):
    ret = imageFilterManager.getAvailableImageFilters()
    return JsonResponse(ret)


@api_view(['POST'])
def filtergeoimage(request):
    jsondata = request.data
    filterId = jsondata["filterId"]
    geoImage = GeoImage.fromJSON(jsondata["geoImage"])
    
    geoImageRet = imageFilterManager.processImage(filterId, geoImage)
    geoImageRet.setDataToBase64()
    return JsonResponse(geoImageRet.toJSON(), safe=False)

@api_view(['POST'])
def getmapminerfeatures(request):
    jsondata = request.data
    mapMinerId = jsondata["mapMinerId"]
    query = jsondata["featureName"]
    region = geojson.loads(jsondata["regions"])
    
    ret = mapMinerManager.requestQueryToMapMiner(mapMinerId, query, region)
    return JsonResponse(ret)

@api_view(['POST'])
def getimagesforfeaturecollection(request):
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
    jsondata = request.data
    imageFilterId = jsondata['imageFilterId']
    featureCollection = geojson.loads(jsondata['featureCollection'])
    ret = {}
    ret['featureCollection'] = imageFilterManager.processImageFromFeatureCollection(imageFilterId, featureCollection)
    ret['regionId'] = jsondata['regionId']
    ret['layerId'] = jsondata['layerId']
    return JsonResponse(ret, CustomJSONEncoder)

    
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

def home(request):
    htmlfile = 'home.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, __merge_two_dicts(__TEMPLATE_GLOBAL_VARS, local_vars))