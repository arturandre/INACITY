#from django_website.GIS.MapMiner import *
from django.contrib.gis.geos import Polygon
import requests
from typing import List
from django_website.Primitives.Primitives import StreetDTO, AmenityDTO
from .MapMiner import *

class OSMMiner(MapMiner):
    """OpenStreetMaps miner constructed using the Overpass API"""

    _overpassBaseUrl = "http://overpass-api.de/api/interpreter?data=";
    _outFormat = "[out:json]"
    _timeout = "[timeout:25]"
    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")

    mapMinerName = "OSMMiner"
    
    mapMinerId = "osm"
    
    def getStreets(region: Polygon) -> List[type(StreetDTO)]:
        jsonData = requests.get(OSMMiner._createCollectStreetsQuery(region)).content
        return jsonData

    def getAmenities(region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError( "Not implemented." )

    def _createCollectStreetsQuery(region: Polygon):
        stringRegion = str(region.coords).replace("(", "").replace(")", "").replace(",", "")
        return OSMMiner._overpassBaseUrl + "%s%s;" % (OSMMiner._outFormat, OSMMiner._timeout) + '(way["highway"~".*"](poly:"'+stringRegion+'");way["surface"~".*"](poly:"'+stringRegion+'"););(way["fixme"](poly:"'+stringRegion+'")->.a;way["highway"="footway"](poly:"'+stringRegion+'")->.a;way["highway"="service"](poly:"'+stringRegion+'")->.a;way["highway"="steps"](poly:"'+stringRegion+'")->.a;way["name"!~".*"](poly:"'+stringRegion+'")->.a;)->.remove;(._; - .remove;);out;>;'



