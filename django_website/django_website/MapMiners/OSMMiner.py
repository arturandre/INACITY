from django.contrib.gis.geos import Polygon, GEOSGeometry
import requests
from typing import List
from django_website.Primitives import *
from django_website.MapMiners import MapMiner
from itertools import chain
import re
from dateutil.parser import parse
from threading import Lock


###### TESTING ################
import time
###### TESTING ################
class OverpassRunningQuery:
    def __init__(self):
        self.pid = 0
        self.spaceLimit = 0
        self.timeLimit = 0
        self.startTime = 0 #i.e. 2018-05-08T21:30:02Z

class OverpassAPIStatus:
    def __init__(self):
        self.connectId = 0
        self.currentTime = 0
        self.rateLimit = 0
        self.waitingTime = []
        self.availableAfter = []
        self.availableSlots = 0
        self.runningQueries = []

    def fromText(textMessage):
        """Creates an OverpassAPIStatus object from the text description obtained at overpass/api/status"""
        ret = OverpassAPIStatus()
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
                    ovpq = OverpassRunningQuery()
                    ovpq.pid = int(fields[0])
                    ovpq.spaceLimit = int(fields[1])
                    ovpq.timeLimit = int(fields[2])
                    ovpq.startTime = parse(fields[3])
                    ret.runningQueries.append(ovpq)
                break
        return ret

class OSMMiner(MapMiner):
    """OpenStreetMaps miner constructed using the Overpass API"""

    _overpassBaseUrl = "http://overpass-api.de/api/interpreter?data="
    _overspassApiStatusUrl = 'http://overpass-api.de/api/status'
    _outFormat = "[out:json]"
    _timeout = "[timeout:25]"
    _lock = Lock()
    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")
        #pass

    mapMinerName = "OSMMiner"
    
    mapMinerId = "osm"

    _rateLimit = -1
    _currentQueries = 0
    
    def _setRateLimit():
        """Check how many queries can be executed concurrently according to OverpassAPI Status"""
        if OSMMiner._rateLimit <= 0:
            statusMessage = str(requests.get(OSMMiner._overspassApiStatusUrl).content)
            ovpStatus = OverpassAPIStatus.fromText(statusMessage)
            OSMMiner._rateLimit = max(OSMMiner._rateLimit, ovpStatus.rateLimit)

    def _waitForAvailableSlots():
        """Collect status from OverpassAPI, available slots and current queries"""
        while True:
            statusMessage = str(requests.get(OSMMiner._overspassApiStatusUrl).content)
            ovpStatus = OverpassAPIStatus.fromText(statusMessage)
            if ovpStatus.availableSlots > 0: break;
            timeToWait = min(ovpStatus.waitingTime)+1 if len(ovpStatus.waitingTime) > 0 else 3
            time.sleep(timeToWait)
            
            
                

    def getStreets(region: List[Polygon]) -> List[type(StreetDTO)]:
        """Collect a set of Ways (from OSM) and convert them to a list of StreetDTO"""
        overpassQueryUrl = OSMMiner._createCollectStreetsQuery(region);

        OSMMiner._lock.acquire()
        OSMMiner._setRateLimit()
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
            osmResult = OSMResult.fromJsonString(jsonString)
        except:
            print("Error while parsing overpass message. Message sample: %s" % jsonString[:100])
        streetSegments = {}
        data = sorted(osmResult.Ways.values(), key=lambda x: x.tags.get('name'))
        g = groupby(data, lambda x: x.tags.get('name'))
        for streetName, group in g:
            nodesList = [x.nodes for x in group]
            OSMMiner._mergeWays(nodesList)
            if streetName in streetSegments:
                #debug only, used to check the necessity of sorting the streets before grouping
                #print("Existing streetName detected! (%s)" % streetName)
                streetSegments[streetName] = streetSegments[streetName] + nodesList
            else:
                streetSegments[streetName] = nodesList
        StreetsDTOList = []
        for streetName in streetSegments:
            for segment in streetSegments[streetName]:
                for nodeIndex in range(len(segment)):
                    osmNode = osmResult.Nodes[segment[nodeIndex]]
                    segment[nodeIndex] = PointDTO(osmNode.id, osmNode.lat, osmNode.lon)
            StreetsDTOList.append(StreetDTO(streetName, streetSegments[streetName]))
            
        return StreetsDTOList

    def getAmenities(region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError("Not implemented.")

    def _createCollectStreetsQuery(region: List[Polygon]):
        """Requests a hardcoded query for the overpass API to collect highways and paths with an asphalt surface"""
        header = OSMMiner._overpassBaseUrl + "%s%s;" % (OSMMiner._outFormat, OSMMiner._timeout)
        outresult = '(.allfiltered;>;);out;'
        middle = ''
        numRegion = 0
        for r in region:
            #numRegion += 1
            stringRegion = str(r.coords).replace("(", "").replace(")", "").replace(",", "")
            middle += '(way["highway"~".*"](poly:"' + stringRegion + '");way["surface"="asphalt"](poly:"' + stringRegion + '");)->.all;(way["fixme"](poly:"' + stringRegion + '")->.a;way["highway"="footway"](poly:"' + stringRegion + '")->.a;way["highway"="service"](poly:"' + stringRegion + '")->.a;way["highway"="steps"](poly:"' + stringRegion + '")->.a;way["name"!~".*"](poly:"' + stringRegion + '")->.a;)->.remove;(.all; - .remove;)->.allfiltered;'
        ret = header+middle+outresult
        return  ret

    def _mergeWays(nodesSegList):
        """Collapse a list of lists of nodes from ways into a single nodes list (if endpoint nodes, from different lists in the same way, are the same)"""
        while True:
            merged = False
            for i in reversed(range(len(nodesSegList))):
                for j in reversed(range(i)):
                  if (nodesSegList[i][0] == nodesSegList[j][0]) or (nodesSegList[i][-1] == nodesSegList[j][-1]): #heads-heads / tails-tails
                    del nodesSegList[i][0]
                    nodesSegList[j] = [x for x in chain([y for y in reversed(nodesSegList[i])], nodesSegList[j])]
                    merged = True
                    break
                  elif nodesSegList[i][-1] == nodesSegList[j][0]: #tails-heads
                    del nodesSegList[i][-1]
                    nodesSegList[j] = [x for x in chain(nodesSegList[i], nodesSegList[j])]
                    merged = True
                    break
                  elif nodesSegList[i][0] == nodesSegList[j][-1]: #heads-tails
                    del nodesSegList[i][0]
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
    
