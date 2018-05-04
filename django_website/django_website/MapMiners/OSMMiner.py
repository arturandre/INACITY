from django.contrib.gis.geos import Polygon, GEOSGeometry
import requests
from typing import List
from django_website.Primitives.Primitives import StreetDTO, AmenityDTO
from django_website.Primitives.OSMPrimitives import *
from django_website.MapMiners import MapMiner
from itertools import chain

class OSMMiner(MapMiner):
    """OpenStreetMaps miner constructed using the Overpass API"""

    _overpassBaseUrl = "http://overpass-api.de/api/interpreter?data="
    _outFormat = "[out:json]"
    _timeout = "[timeout:25]"
    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")

    mapMinerName = "OSMMiner"
    
    mapMinerId = "osm"
    
    def getStreets(region: Polygon) -> List[type(StreetDTO)]:
        jsonString = requests.get(OSMMiner._createCollectStreetsQuery(region)).content
        osmResult = OSMResult.fromJsonString(jsonString)
        streets = {}
        g = groupby(osmResult.Ways.values(), lambda x: x.tags.get('name'))
        for k, group in g:
            nodesList = [x.nodes for x in group]
            OSMMiner._mergeWays(nodesList)
            streets[k] = nodesList
        for k in streets:
            for s in streets[k]:
                for i in range(len(s)):
                    s[i] = osmResult.Nodes[s[i]]
        return streets

    def getAmenities(region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError("Not implemented.")

    def _createCollectStreetsQuery(region: Polygon):
        stringRegion = str(region.coords).replace("(", "").replace(")", "").replace(",", "")
        return OSMMiner._overpassBaseUrl + "%s%s;" % (OSMMiner._outFormat, OSMMiner._timeout) + '(way["highway"~".*"](poly:"' + stringRegion + '");way["surface"~".*"](poly:"' + stringRegion + '"););(way["fixme"](poly:"' + stringRegion + '")->.a;way["highway"="footway"](poly:"' + stringRegion + '")->.a;way["highway"="service"](poly:"' + stringRegion + '")->.a;way["highway"="steps"](poly:"' + stringRegion + '")->.a;way["name"!~".*"](poly:"' + stringRegion + '")->.a;)->.remove;(._; - .remove;);(._;>;);out;'

    def _mergeWays(nodesSegList): 
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
    
