import sys

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import Http404, HttpResponse, JsonResponse, HttpResponseRedirect
from django.utils.translation import gettext
from uuid import uuid4


import ast
import json
import datetime
#from django.contrib.gis.geos import GEOSGeometry, Polygon
import geojson
from geojson import Polygon, Feature, FeatureCollection
from django_website.Primitives.GeoImage import GeoImage, CustomJSONEncoder

from django_website.models import Session
from django.core.exceptions import MultipleObjectsReturned


# General functions
from django.conf import settings
from django_website import settings_secret
from django_website.LogGenerator import write_to_log
from django.shortcuts import render, redirect
from django.template import loader


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
    write_to_log(f"getlastsessionid - sessionId: {sessionId}")
    write_to_log(f"sessionId: {sessionId}")
    if sessionId is None:
        return HttpResponse(status=200)
    return HttpResponse(sessionId, status=200)

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
    write_to_log("newsession")
    request.session['sessionId'] = str(uuid4())
    if request.session.get('uiModelJSON') is not None: del request.session['uiModelJSON']
    #print(f"request.session['sessionId']: {request.session['sessionId']}")
    return HttpResponse(request.session.get('sessionId'), status=200)

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
    
    if request.data is None:
        return HttpResponse('No content to be saved!', status = 400)
    sessionName = (request.data.get('sessionName') or request.session.get('sessionName') or request.session.get('sessionId'))
    write_to_log(f"request.session[sessionId]: {request.session.get('sessionId')}")
    write_to_log(f'sessionName: {str(sessionName)}')
    if request.user.is_authenticated:
        sessionId = request.session.get('sessionId')
        write_to_log('uiModelJSON-sessionName:' + str(request.data.get('sessionName')))
        write_to_log(f'sessionId:{sessionId}')
        if sessionId is None:
            if sessionName is None:
                session = Session.objects.create(user = request.user, sessionName = '', uimodelJSON = json.dumps(request.data))
                session.save()
                session.sessionName = session.id
                session.save()
            else:
                session = Session.objects.create(user = request.user, sessionName = sessionName, uimodelJSON = json.dumps(request.data))
                session.save()

        else:
            try:
                session = Session.objects.get(id = sessionId)
                if not isUserSession(request.user, session):
                    write_to_log("isUserSession")
                    del request.session['sessionId']
                    return forbiddenUserSessionHttpResponse()
                if (sessionName is not None) and (len(sessionName) > 0):
                    session.sessionName = sessionName
                session.uimodelJSON = json.dumps(request.data)
                session.save()
            except Session.DoesNotExist:
                session = Session.objects.create(user = request.user, sessionName = sessionName, uimodelJSON = json.dumps(request.data))
                session.save()
        write_to_log("savesession")
        write_to_log(f"request.session['sessionId']: {request.session.get('sessionId')}")
        request.session['sessionId'] = session.id
        write_to_log(f"request.session['sessionId']: {request.session.get('sessionId')}")
    else:
        if request.session.get('sessionId') is None:
            request.session['sessionId'] = str(uuid4())
    request.session['sessionData'] = request.data
    if request.session.get('sessionId') is not None:
        return HttpResponse(request.session['sessionId'],status=200)
    else:
        return HttpResponse(status=204)

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
                sessionData = request.session.get('sessionData')
                if sessionData:
                    return JsonResponse(sessionData)
                    write_to_log("loadsession: sessionData loaded!")
                else:
                    write_to_log("loadsession: no sessionData")
                    return HttpResponse(status=200)
            session = Session.objects.get(id = sessionId)
            if not isUserSession(request.user, session):
                if request.session.get('sessionId') is not None:
                    del request.session['sessionId']
                return forbiddenUserSessionHttpResponse()
            write_to_log(f"loadsession request.session['sessionId']: {request.session['sessionId']}")
            write_to_log(f"loadsession sessionId: {sessionId}")
            request.session['sessionId'] = sessionId
            
            request.session['sessionData'] = ast.literal_eval(session.uimodelJSON)
            #print(request.session['sessionData'])
            return JsonResponse(ast.literal_eval(session.uimodelJSON))
        except Session.DoesNotExist:
            sessionData = request.session.get('sessionData')
            if sessionData:
                return JsonResponse(sessionData)
            else:
                return HttpResponse(status=200)
        pass
    else:
        sessionData = request.session.get('sessionData')
        if sessionData:
            return JsonResponse(sessionData)
        else:
            return HttpResponse(status=200)

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
            session = Session.objects.get(id=sessionId)
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
    del request.session['sessionId']
    del request.session['uiModelJSON']
    return HttpResponse(status=204)

#Delete's an user session (WARNING)
@api_view(['POST'])
def deletesession(request):
    """
    End-point to delete a previously saved user session.

    This function removes the user session from the application
    level database (django_website_session table).

    With the session all the information collected (i.e regions)
    are removed as well.

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with a JSON object
        containing the sessionId of the session 
        to be deleted.

        E.g.:
        {
            "sessionId": "4594-..."
        }

        

    Returns
    -------
    HttpResponse:
    - 204 if the session is removed successfully
    - 403 Forbidden if the user has not signed in.
    - 404 if the sessionId does not exists in the database
    """
    if request.user.is_authenticated:
        jsonData = request.data
        sessionId = jsonData.get('sessionId')
        try:
            session = Session.objects.get(id=sessionId)
            if not isUserSession(request.user, session):
                return forbiddenUserSessionHttpResponse()
            write_to_log(f"request.session['sessionId']: {request.session.get('sessionId')}")
            write_to_log(f"session.id: {session.id}")
            if request.session.get('sessionId') == str(session.id):
                del request.session['sessionId']
                del request.session['sessionData']
            session.delete()
        except Session.DoesNotExist:
            HttpResponse(gettext("This session could not be found."), status=404)
        except Exception as e:
            write_to_log(f"Unexpected error: {sys.exc_info()[0]}")
            write_to_log(f"Error message: {e.args}")
    else:
        HttpResponse(gettext("User needs to be logged to delete a session."),  status=403)
    return HttpResponse(status=204)