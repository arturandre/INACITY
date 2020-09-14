#from django.template.loader import get_template
#from django.http import HttpResponse
import sys
from GSVPanoramaManager.db import DBManager

import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import Http404, HttpResponse, HttpResponseNotFound, JsonResponse, HttpResponseRedirect
from django.utils.translation import gettext
from uuid import uuid4
from urllib.parse import unquote, urlparse
from django_website.LogGenerator import write_to_log

import ast
import json
import datetime
#from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.contrib.auth.decorators import login_required
import geojson
from geojson import Polygon, Feature, FeatureCollection
from django_website.Primitives.GeoImage import GeoImage, CustomJSONEncoder

from django_website.Managers.MapMinerManager import MapMinerManager
from django_website.Managers.ImageProviderManager import ImageProviderManager
from django_website.Managers.ImageFilterManager import ImageFilterManager
from django_website.Managers.UserManager import UserManager

from django_website.models import Session, UserViewComments
from django.core.exceptions import MultipleObjectsReturned

#Translation & Internationalization
from django.utils import translation
from django.conf import settings

imageFilterManager = ImageFilterManager()

# @TODO: Make the translation call accept POST, store it's session and then translate the page keeping user data unchanged (forms/session)
def lang(request, lang_code):
    """
    End-point to translate the page.
    Ref: https://docs.djangoproject.com/en/2.1/topics/i18n/
    """
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

@api_view(['POST'])
def processimagesfromfeaturecollection(request):
    """
    End-point to process images previously collected.
    Notice that the regionId and layerId passed
    in the request and then returned are used
    as a syncronizing mechanism allowing
    async calls from the front-end.

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
    - 'featureCollection': A <GeoJSON> in which the
    properties field of each feature will contain a
    geoImage collection (structured just like the
    feature coordinates array) and each geoImage
    will contain a new entry named as the filterId
    under the property called 'processedDataList'.
    
    GeoImages now will contain a new entry (the
    filter id) at the property 'processedDataList'
    containing the result of the processed GeoImage.
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


@api_view(['POST'])
def processimagesfromfeature(request):
    """
    End-point to process images previously
    collected and present into a single
    feature rather than in a feature collection.
    

    Parameters
    ----------
    request : HttpRequest
        An HTTP 'POST' request with:
        - Image Filter Id (str)
        - feature (GeoJSON)
            Notice that the feature must have
            GeoImages at the 'properties' property as
            explained in the function 
            'getimagesforfeaturecollection'.
        
        E.g.:

        {
            'imageFilterId': 'gsv',
            'feature': <GeoJSON(with GeoImages)>
        }

    Returns
    -------
    JsonResponse: Dict with the keys:
    - 'feature': A <GeoJSON> in which the
    properties field will contain a
    geoImage collection (structured just like the
    feature coordinates array) and each geoImage
    will contain a new entry named as the filterId
    under the property called 'processedDataList'.
    
    GeoImages now will contain a new entry (the
    filter id) at the property 'processedDataList'
    containing the result of the processed GeoImage.

    """
    jsondata = request.data
    imageFilterId = jsondata['imageFilterId']
    feature = geojson.loads(jsondata['feature'])
    ret = {}
    ret['feature'] = imageFilterManager.processImageFromFeature(imageFilterId, feature)
    return JsonResponse(ret, CustomJSONEncoder)

@api_view(['POST'])
@login_required
def comment_view(request):
    jsondata = request.data
    geoimage = jsondata['geoimage']
    geoimage = json.loads(geoimage)
    geoimage = GeoImage.fromJSON(geoimage)
    comment = jsondata['comment']
    dbmanager = DBManager()
    view = dbmanager.get_view_from_geoimage(geoImage=geoimage, include_id=True)
    if not view:
        return HttpResponseNotFound('View associated with GeoImage not found!')
    view_id = view[0]
    UserViewComments.objects.create(
        user=request.user,
        last_update=datetime.date.today(),
        viewid=view_id,
        comment=comment
        )
    dbmanager.insert_comment_for_view(
        geoImage=geoimage,
        user_id=request.user.id,
        comment=comment)
    return HttpResponse(comment, status=201)

@api_view(['POST'])
def get_comments_view(request):
    jsondata = request.data
    geoimage = jsondata['geoimage']
    geoimage = json.loads(geoimage)
    geoimage = GeoImage.fromJSON(geoimage)
    filteruserid = jsondata.get('filteruserid')
    dbmanager = DBManager()
    comments = dbmanager.get_comments_for_view(
        geoImage=geoimage,
        user_id=filteruserid)
    comments = {"comments": comments}
    #write_to_log(comments)
    return JsonResponse(comments, CustomJSONEncoder)