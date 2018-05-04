from django.contrib.gis.geos import Polygon, GEOSGeometry
import requests
from typing import List
from django_website.Primitives.Primitives import PointDTO, StreetDTO, AmenityDTO
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
        """Collect a set of Ways (from OSM) and convert them to a list of StreetDTO"""
        jsonString = requests.get(OSMMiner._createCollectStreetsQuery(region)).content
        osmResult = OSMResult.fromJsonString(jsonString)
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
                    segment[nodeIndex] = PointDTO(osmNode.lat, osmNode.lon)
            StreetsDTOList.append(StreetDTO(streetName, streetSegments[streetName]))
            
        return StreetsDTOList

    def getAmenities(region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError("Not implemented.")

    def _createCollectStreetsQuery(region: Polygon):
        """Requests a hardcoded query for the overpass API to collect highways and paths with an asphalt surface"""
        stringRegion = str(region.coords).replace("(", "").replace(")", "").replace(",", "")
        return OSMMiner._overpassBaseUrl + "%s%s;" % (OSMMiner._outFormat, OSMMiner._timeout) + '(way["highway"~".*"](poly:"' + stringRegion + '");way["surface"="asphalt"](poly:"' + stringRegion + '"););(way["fixme"](poly:"' + stringRegion + '")->.a;way["highway"="footway"](poly:"' + stringRegion + '")->.a;way["highway"="service"](poly:"' + stringRegion + '")->.a;way["highway"="steps"](poly:"' + stringRegion + '")->.a;way["name"!~".*"](poly:"' + stringRegion + '")->.a;)->.remove;(._; - .remove;);(._;>;);out;'

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
    
