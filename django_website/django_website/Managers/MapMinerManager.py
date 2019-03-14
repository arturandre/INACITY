from geojson import Polygon, FeatureCollection
from typing import List

from django_website.Primitives import *
from django_website.MapMiners import *

class MapMinerManager(object):
    __instance__ = None
    def __init__(self):
        self._MapMiners = {}
        for mapMinerClass in MapMiner._subclasses:
            self.registerMapMiner(mapMinerClass)

    def __new__(cls):
        if MapMinerManager.__instance__ is None:
            MapMinerManager.__instance__ = object.__new__(cls)
        return MapMinerManager.__instance__

    def registerMapMiner(self, mapMiner: MapMiner):
        if not mapMiner.mapMinerId in self._MapMiners:
            self._MapMiners[mapMiner.mapMinerId] = mapMiner
        pass

    def getAvailableMapMinersAndQueries(self):
        return [{'id': mapMinerId, 'name': self._MapMiners[mapMinerId].mapMinerName, 'features': [{'name': featureId, 'id': featureId} for featureId in self._MapMiners[mapMinerId].getAvailableQueries()]} for mapMinerId in self._MapMiners]

    def requestQueryToMapMiner(self, mapMinerId: str, query: str, region: FeatureCollection) -> List[FeatureCollection]:
        """Delegate the requested query call to the selected MapMiner"""
        ret = self._MapMiners[mapMinerId].doQuery(query, region)
        
        return ret