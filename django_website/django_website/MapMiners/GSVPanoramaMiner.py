from geojson import Point, LineString, MultiLineString, Polygon, Feature, FeatureCollection
from django.contrib.gis.gdal import SpatialReference
import requests
from typing import List

from .MapMiner import MapMiner
from itertools import chain
import re
from dateutil.parser import parse
from threading import Lock
import sys

from django_website.LogGenerator import write_to_log

from django_website.geofunctions import flip_geojson_coordinates

from GSVPanoramaManager.db import DBManager 


class GSVPanoramaMiner(MapMiner):
    """
    GSVPanoramaMiner used to access panoramas stored by
    the GSVPanoramaManager django app.

    class members:
        Derived from MapMiner:
            - mapMinerName : 'GSVPanoramaMiner'
            - mapMinerId : 'GSVPanoramaMiner'
            - _basecrs : SpatialReference(4326)
    """

    mapMinerName = "GSVPanoramaMiner"
    mapMinerId = "GSVPanoramaMiner"

    # EPSG:4326
    # Since OpenLayers and GSVPanoramaMiner different SRID a convertion is needed
    _basecrs = SpatialReference(4326)
    _crs = {
        "type": "name",
        "properties": {
            "name": "EPSG:4326"
        }
    }

    _outFormat = "[out:json]"
    _timeout = "[timeout:60]"
    _lock = Lock()

    _basecrs = SpatialReference(3857)
    _crs = {
        "type": "name",
        "properties": {
            "name": "EPSG:3857"
        }
    }
    def __init__(self):
        raise Exception(
            "This is a static class and should not be instantiated.")
        # pass

    @staticmethod
    def _getPanoramasInBoundingBoxes(regions: FeatureCollection) -> MultiLineString:
        """Collect a set of Ways (from GSVPanoramaManager) and convert them to a MultiLineString"""

        neo4jDB = DBManager()



        overpassQueryUrl = OSMMiner._createCollectStreetsQuery(regions)

        try:
            # TODO: Treat cases in which the OSM server fails
            osmResult = OSMResult.fromJsonString(jsonString)
        except:
            write_to_log(
                "Error while parsing overpass message. Message sample: %s" % jsonString[:100])
            raise AttributeError("Invalid jsonString")
        streetSegments = {}

        # Data needs to be sorted before being grouped, otherwise
        # the same group may appear multiple times
        data = sorted(osmResult.Ways.values(),
                      key=lambda x: x.tags.get('name'))
        g = groupby(data, lambda x: x.tags.get('name'))
        for streetName, group in g:
            nodesList = [x.nodes for x in group]
            OSMMiner._mergeWays(nodesList)
            if streetName in streetSegments:
                streetSegments[streetName] = streetSegments[streetName] + nodesList
            else:
                streetSegments[streetName] = nodesList
        featuresList = []
        for streetName in streetSegments:
            featuresList.append(
                Feature(id=streetName,
                        properties={'name': streetName},
                        geometry=MultiLineString([LineString([
                            Point([osmResult.Nodes[n].lon,
                                   osmResult.Nodes[n].lat]) for n in s])
                            for s in streetSegments[streetName]]))
            )

        return FeatureCollection(featuresList, crs=OSMMiner._crs)
        # return StreetsDTOList

    _availableQueries = {'Streets': _getStreets}
