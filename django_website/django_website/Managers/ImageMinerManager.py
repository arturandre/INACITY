from geojson import Polygon, FeatureCollection
from typing import List

from django_website.ImageMiners.ImageMiner import ImageMiner
from geojson import FeatureCollection
from typing import List
from django_website.Primitives.Primitives import GeoImage

class ImageMinerManager(object):
    """Mediator class instantiated as a singleton responsible for managing all the image platforms adaptors implemented"""
    __instance = None
    def __init__(self):
        self._ImageMiners = {}
        for imageMinerClass in ImageMiner._subclasses:
            self.registerImageMiner(imageMinerClass)

    def __new__(cls):
        if ImageMinerManager.__instance is None:
            ImageMinerManager.__instance = object.__new__(cls)
        return ImageMinerManager.__instance

    def registerImageMiner(self, miner: ImageMiner):
        if not miner.imageMinerName in self._ImageMiners:
            self._ImageMiners[miner.imageMinerName] = miner
        pass


    def requestGeoImageToImageMiner(self, imageMinerName: str, locations: FeatureCollection) -> List[FeatureCollection]:
        """Delegate request to the selected image miner"""
        return self._ImageMiners[imageMinerName].getGeoImagesFromLocations(locations)
        
        

    @property
    def ImageMiners(self):
        return self._ImageMiners

    def getImageForFeatureCollection(self, imageMinerName, featureCollection: FeatureCollection)->List[GeoImage]:
        return self._ImageMiners[imageMinerName].getImageForFeatureCollection(featureCollection)