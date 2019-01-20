from geojson import Point, LineString, MultiLineString, Polygon, Feature, FeatureCollection
from django.contrib.gis.gdal import SpatialReference
import requests
from typing import List
from django_website.Primitives.OSMPrimitives import *
from .MapMiner import MapMiner
from itertools import chain
import re
from dateutil.parser import parse
from threading import Lock
import sys

from django_website.geofunctions import flip_geojson_coordinates


class OSMMiner(MapMiner):
    mapMinerName = "OpenStreetMap"
    mapMinerId = "osm"

    """OpenStreetMaps miner constructed using the Overpass API"""
    #EPSG:3857
    #Since OpenLayers and OSMMiner use the same SRID no convertion is needed
    _basecrs = SpatialReference(3857)

    # _OSMServerURL defines where should the OSMMiner collect GIS Data
    # Options are:
    # OverpassAPI.DE -> Public OSM API (with limits of request's size/rate)
    # inacity.org -> INACITY's private mirror of OSM
    _OSMServerURL = 'inacity.org'

    inacityorg = 'inacity.org'
    overpassapi = 'OverpassAPI.DE'
    if _OSMServerURL == inacityorg:
        _overpassBaseUrl = "http://ssh.inacity.org/api/interpreter?data="
    elif _OSMServerURL == overpassapi:
        _overpassBaseUrl = "http://overpass-api.de/api/interpreter?data="
    else:
        raise ValueError('Invalid _OSMServerURL ('+_OSMServerURL+')!')

    _overspassApiStatusUrl = 'http://overpass-api.de/api/status'


    _outFormat = "[out:json]"
    _timeout = "[timeout:60]"
    _lock = Lock()
    
    _destcrs = SpatialReference(3857)
    _crs = {
    "type": "name",
    "properties": {
        "name": "EPSG:3857"
    }
    }



 
    class OverpassRunningQuery:
        """Dedicated class to wrap Overpass status running queries data, if any is available"""
        def __init__(self):
            self.pid = 0
            self.spaceLimit = 0
            self.timeLimit = 0
            self.startTime = 0 #i.e. 2018-05-08T21:30:02Z
        pass

    class OverpassAPIStatus:
        """Dedicated class to wrap Overpass status data"""
        def __init__(self):
            self.connectId = 0
            self.currentTime = 0
            self.rateLimit = 0
            self.waitingTime = []
            self.availableAfter = []
            self.availableSlots = 0
            self.runningQueries = []

        @staticmethod
        def fromText(textMessage):
            """Creates an OverpassAPIStatus object from the text description obtained at overpass/api/status"""
            ret = OSMMiner.OverpassAPIStatus()
            lines = textMessage.split(r'\n')
            if len(lines) < 4: return ret
            m = re.search(r'Connected as: (\d+)$', lines[0])
            if m: ret.connectId = int(m.group(1))
            m = re.search(r'Current time: (.+?)$', lines[1])
            if m: ret.currentTime = parse(m.group(1))
            m = re.search(r'Rate limit: (\d+)$', lines[2])
            if m: ret.rateLimit = int(m.group(1))
            startAtLine = 3
            for lineno, line in enumerate(lines[startAtLine:]):
                m = re.search(r'^(\d+) slots available now.', line)
                if m:
                    ret.availableSlots = int(m.group(1))
                    continue
                m = re.search(r'Slot available after: (.+?), in (\d+?) seconds.', line)
                if m:
                    ret.availableAfter.append(parse(m.group(1)))
                    ret.waitingTime.append(int(m.group(2)))
                    continue
                if line == r'Currently running queries (pid, space limit, time limit, start time):':
                    for subline in lines[lineno+startAtLine+1:]:
                        fields = subline.split('\t')
                        if len(fields) != 4: continue
                        ovpq = OSMMiner.OverpassRunningQuery()
                        ovpq.pid = int(fields[0])
                        ovpq.spaceLimit = int(fields[1])
                        ovpq.timeLimit = int(fields[2])
                        ovpq.startTime = parse(fields[3])
                        ret.runningQueries.append(ovpq)
                    break
            return ret
        pass

    _overpassBaseUrl = "http://overpass-api.de/api/interpreter?data="
    #_overpassBaseUrl = "http://inacity.eastus.cloudapp.azure.com/api/interpreter?data="
    _overspassApiStatusUrl = 'http://overpass-api.de/api/status'
    _outFormat = "[out:json]"
    _timeout = "[timeout:60]"
    _lock = Lock()
    
    _destcrs = SpatialReference(3857)
    _crs = {
    "type": "name",
    "properties": {
        "name": "EPSG:3857"
    }
    }

    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")
        #pass

    def _initialize(cls):
        module = sys.modules[__name__]
        setattr(module, "OSMMiner", cls)
        OSMMiner._setRateLimit()
        pass

    _getStreets = None    
    

    _rateLimit = -1
    _currentQueries = 0
    
    def _setRateLimit():
        if OSMMiner._OSMServerURL == OSMMiner.inacityorg:
            OSMMiner._rateLimit = 99999999
            return
        elif OSMMiner._OSMServerURL == OSMMiner.overpassapi:
            """Check how many queries can be executed concurrently according to OverpassAPI Status"""
            if OSMMiner._rateLimit <= 0:
                statusMessage = str(requests.get(OSMMiner._overspassApiStatusUrl).content)
                ovpStatus = OSMMiner.OverpassAPIStatus.fromText(statusMessage)
                OSMMiner._rateLimit = max(OSMMiner._rateLimit, ovpStatus.rateLimit)
            if OSMMiner._rateLimit <= 0:
                raise ValueError("Couldn't set the rateLimit value!")

    def _waitForAvailableSlots():
        """Collect status from OverpassAPI, available slots and current queries"""
        if OSMMiner._OSMServerURL == OSMMiner.inacityorg:
            pass
        elif OSMMiner._OSMServerURL == OSMMiner.overpassapi:
            while True:
                statusMessage = str(requests.get(OSMMiner._overspassApiStatusUrl).content)
                ovpStatus = OSMMiner.OverpassAPIStatus.fromText(statusMessage)
                if ovpStatus.availableSlots > 0: break;
                timeToWait = min(ovpStatus.waitingTime)+1 if len(ovpStatus.waitingTime) > 0 else 3
                time.sleep(timeToWait)

    def _preFormatInput(GeoJsonInput: FeatureCollection):
        flip_geojson_coordinates(GeoJsonInput)
        return GeoJsonInput

    def _getStreets(regions: FeatureCollection) -> MultiLineString:
        """Collect a set of Ways (from OSM) and convert them to a MultiLineString"""

        overpassQueryUrl = OSMMiner._createCollectStreetsQuery(regions)

        OSMMiner._lock.acquire()
        print("Rate limit %d, current queries: %d \n" % (OSMMiner._rateLimit, OSMMiner._currentQueries))
        while OSMMiner._currentQueries >= OSMMiner._rateLimit:
            time.sleep(1)
        OSMMiner._waitForAvailableSlots()
        OSMMiner._currentQueries += 1
        ##DEBUG
        #print("added query: %d\n" % OSMMiner._currentQueries)
        OSMMiner._lock.release()
        jsonString = requests.get(overpassQueryUrl).content
        OSMMiner._currentQueries -= 1
        ##DEBUG
        #print("removed query: %d\n" % OSMMiner._currentQueries)
        try:
            #TODO: Treat cases in which the OSM server fails
            osmResult = OSMResult.fromJsonString(jsonString)
        except:
            print("Error while parsing overpass message. Message sample: %s" % jsonString[:100])
            raise AttributeError("Invalid jsonString")
        streetSegments = {}
        
        # Data needs to be sorted before being grouped, otherwise
        # the same group may appear multiple times
        data = sorted(osmResult.Ways.values(), key=lambda x: x.tags.get('name'))
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
                    properties={'name':streetName}, 
                    geometry=MultiLineString([LineString([
                    Point([osmResult.Nodes[n].lon, 
                    osmResult.Nodes[n].lat]) for n in s]) 
                    for s in streetSegments[streetName]]))
            )
           
        return FeatureCollection(featuresList, crs=OSMMiner._crs)
        #return StreetsDTOList

    def _createCollectStreetsQuery(regions: FeatureCollection):
        """Requests a hardcoded query for the overpass API to collect highways and paths with an asphalt surface"""
        header = OSMMiner._overpassBaseUrl + "%s%s;" % (OSMMiner._outFormat, OSMMiner._timeout)
        outresult = '(.allfiltered;>;);out;'
        middle = ''
        numRegion = 0
            
        for feature in regions['features']:
            geom = feature['geometry']
            assert type(geom is Polygon)
            #numRegion += 1
            #stringRegion = str(r.coords).replace("(", "").replace(")", "").replace(",", "")
            stringRegion = str(geom.get('coordinates')).replace('[','').replace(']','').replace(',','')
            middle += '(way["highway"~".*"](poly:"' + stringRegion + '");way["surface"="asphalt"](poly:"' + stringRegion + '");)->.all;(way["fixme"](poly:"' + stringRegion + '")->.a;way["highway"="footway"](poly:"' + stringRegion + '")->.a;way["highway"="service"](poly:"' + stringRegion + '")->.a;way["highway"="steps"](poly:"' + stringRegion + '")->.a;way["name"!~".*"](poly:"' + stringRegion + '")->.a;)->.remove;(.all; - .remove;)->.allfiltered;'
            ret = header+middle+outresult
        return  ret

    def _mergeWays(nodesSegList):
        """Collapse a list of lists of nodes from ways into a single nodes list (if endpoint nodes, from different lists in the same way, are the same)"""
        while True:
            merged = False
            for i in reversed(range(len(nodesSegList))):
                for j in reversed(range(i)):
                  if (nodesSegList[i][0] == nodesSegList[j][0]): #heads-heads
                    #Remove repeated element from the second list
                    del nodesSegList[j][0]
                    nodesSegList[j] = [x for x in chain([y for y in reversed(nodesSegList[i])], nodesSegList[j])]
                    merged = True
                    break
                  elif (nodesSegList[i][-1] == nodesSegList[j][-1]): #tails-tails
                    #Remove repeated element from the second list
                    del nodesSegList[j][-1]
                    nodesSegList[j] = [x for x in chain(nodesSegList[j], [y for y in reversed(nodesSegList[i])])]
                    merged = True
                    break
                  elif nodesSegList[i][-1] == nodesSegList[j][0]: #tails-heads
                    #Remove repeated element from the second list
                    del nodesSegList[j][0]
                    nodesSegList[j] = [x for x in chain(nodesSegList[i], nodesSegList[j])]
                    merged = True
                    break
                  elif nodesSegList[i][0] == nodesSegList[j][-1]: #heads-tails
                    #Remove repeated element from the second list
                    del nodesSegList[j][-1]
                    nodesSegList[j] = [x for x in chain(nodesSegList[j], nodesSegList[i])]
                    merged = True
                    break
                if merged:
                    #debugging only
                    #print("deleted: ", nodesSegList[i])
                    #print("merged: ", nodesSegList[j])
                    del nodesSegList[i]
                    break
            if not merged: break
        return nodesSegList
    
    _availableQueries = {'Streets': _getStreets}
    
