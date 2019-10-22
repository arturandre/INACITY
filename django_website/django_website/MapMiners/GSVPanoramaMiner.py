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

    @staticmethod
    def _setRateLimit():
        if OSMMiner._OSMServerURL == OSMMiner.inacityorg:
            OSMMiner._rateLimit = 99999999
            return
        elif OSMMiner._OSMServerURL == OSMMiner.overpassapi:
            """Check how many queries can be executed concurrently according to OverpassAPI Status"""
            if OSMMiner._rateLimit <= 0:
                statusMessage = str(requests.get(
                    OSMMiner._overspassApiStatusUrl).content)
                ovpStatus = OSMMiner.OverpassAPIStatus.fromText(statusMessage)
                OSMMiner._rateLimit = max(
                    OSMMiner._rateLimit, ovpStatus.rateLimit)
            if OSMMiner._rateLimit <= 0:
                raise ValueError("Couldn't set the rateLimit value!")

    @staticmethod
    def _waitForAvailableSlots():
        """Collect status from OverpassAPI, available slots and current queries"""
        if OSMMiner._OSMServerURL == OSMMiner.inacityorg:
            pass
        elif OSMMiner._OSMServerURL == OSMMiner.overpassapi:
            while True:
                statusMessage = str(requests.get(
                    OSMMiner._overspassApiStatusUrl).content)
                ovpStatus = OSMMiner.OverpassAPIStatus.fromText(statusMessage)
                if ovpStatus.availableSlots > 0:
                    break
                timeToWait = min(ovpStatus.waitingTime) + \
                    1 if len(ovpStatus.waitingTime) > 0 else 3
                time.sleep(timeToWait)

    @staticmethod
    def _createCollectStreetsQuery(regions: FeatureCollection):
        """Requests a hardcoded query for the overpass API to collect highways and paths with an asphalt surface"""
        header = OSMMiner._overpassBaseUrl + \
            "%s%s;" % (OSMMiner._outFormat, OSMMiner._timeout)
        outresult = '(.allfiltered;>;);out;'
        middle = ''
        numRegion = 0

        for feature in regions['features']:
            geom = feature['geometry']
            assert type(geom is Polygon)
            #numRegion += 1
            #stringRegion = str(r.coords).replace("(", "").replace(")", "").replace(",", "")
            stringRegion = str(geom.get('coordinates')).replace(
                '[', '').replace(']', '').replace(',', '')
            middle += '(way["highway"~".*"](poly:"' + stringRegion + '");way["surface"="asphalt"](poly:"' + stringRegion + '");)->.all;(way["fixme"](poly:"' + stringRegion + '")->.a;way["highway"="footway"](poly:"' + stringRegion + \
                '")->.a;way["highway"="service"](poly:"' + stringRegion + '")->.a;way["highway"="steps"](poly:"' + stringRegion + \
                '")->.a;way["name"!~".*"](poly:"' + stringRegion + \
                '")->.a;)->.remove;(.all; - .remove;)->.allfiltered;'
            ret = header+middle+outresult
        return ret

    @staticmethod
    def _mergeWays(nodesSegList: List[OSMNode]):
        """
        Collapse a list of lists of nodes from ways into a
        single nodes list (if endpoint nodes, from
        different lists in the same way, are the same).

        For example, let nodesSegList = 
        [
            [[0,0], [0,1], [0,2], [0,3]], # 1st Line
            [[0,3], [1,1], [1,2], [1,3]], # 2nd Line
        ]
        In this example nodesSegList contains
        two line strings, each with 4 coordinates.
        Notice that the last coordinate of the 1st
        Line ([0,3]) is the same as the first one
        from the 2nd Line, so both lines can be merged
        into a single longer line:

        [[0,0], [0,1], [0,2], "[0,3]", [1,1], [1,2], [1,3]]

        Parameters
        ----------
        nodesSegList : List[OSMNode]
            A list of :class:`OSMNode` objects
            from an :class:`OSMWay` object.
            Each of this nodes represents a
            point in a path like a street
            or avenue.

        Returns
        -------
        The same list after the merging was done.

        """
        while True:
            merged = False
            for i in reversed(range(len(nodesSegList))):
                for j in reversed(range(i)):
                    if (nodesSegList[i][0] == nodesSegList[j][0]):  # heads-heads
                        # Remove repeated element from the second list
                        del nodesSegList[j][0]
                        nodesSegList[j] = [x for x in chain(
                            [y for y in reversed(nodesSegList[i])], nodesSegList[j])]
                        merged = True
                        break
                    elif (nodesSegList[i][-1] == nodesSegList[j][-1]):  # tails-tails
                        # Remove repeated element from the second list
                        del nodesSegList[j][-1]
                        nodesSegList[j] = [x for x in chain(
                            nodesSegList[j], [y for y in reversed(nodesSegList[i])])]
                        merged = True
                        break
                    elif nodesSegList[i][-1] == nodesSegList[j][0]:  # tails-heads
                        # Remove repeated element from the second list
                        del nodesSegList[j][0]
                        nodesSegList[j] = [x for x in chain(
                            nodesSegList[i], nodesSegList[j])]
                        merged = True
                        break
                    elif nodesSegList[i][0] == nodesSegList[j][-1]:  # heads-tails
                        # Remove repeated element from the second list
                        del nodesSegList[j][-1]
                        nodesSegList[j] = [x for x in chain(
                            nodesSegList[j], nodesSegList[i])]
                        merged = True
                        break
                if merged:
                        # debugging only
                        #print("deleted: ", nodesSegList[i])
                        #print("merged: ", nodesSegList[j])
                    del nodesSegList[i]
                    break
            if not merged:
                break
        return nodesSegList

    _availableQueries = {'Streets': _getStreets}
