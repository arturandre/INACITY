from geojson import Polygon, FeatureCollection
from typing import List

from django_website.Primitives import *
from django_website.MapMiners import *

class MapMinerManager(object):
    __instance = None
    def __init__(self):
        self._MapMiners = {}
        for mapMinerClass in MapMiner._subclasses:
            self.registerMapMiner(mapMinerClass)

    def __new__(cls):
        if MapMinerManager.__instance is None:
            MapMinerManager.__instance = object.__new__(cls)
        return MapMinerManager.__instance

    def registerMapMiner(self, mapMiner: MapMiner):
        if not mapMiner.mapMinerName in self._MapMiners:
            self._MapMiners[mapMiner.mapMinerName] = mapMiner
        pass

    def getAvailableMapMinersAndQueries():
        return {mapMiner: mapMiner.getAvailableQueries() for mapMiner in self._MapMiners}

    def requestQueryToMapMiner(self, mapMinerName: str, query: str, region: [Polygon]) -> List[FeatureCollection]:
        """Delegate the requested query call to the selected MapMiner"""
        return self._MapMiners[mapMinerName].doQuery(query, region)
    
    #def getStreets(self, region: Polygon) -> List[type(StreetDTO)]:
    #    """Delegate the getStreets call to a MapMiner"""
    #    #TODO: Solve the conflation problem/create a heuristic to choose a MapMiner
    #    return self._MapMiners['OSMMiner'].getStreets(region)

    def getAmenities(self, region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        """Delegate the getAmenities call to a MapMiner"""
        #TODO: Solve the conflation problem/create a heuristic to choose a MapMiner
        return self._MapMiners['OSMMiner'].getAmenities(region, amenityType)

    #@property
    #def MapMiners(self):
    #    return self._MapMiners()

