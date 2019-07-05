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

#Translation & Internationalization
from django.utils import translation
from django.conf import settings

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
