from geojson import Polygon, FeatureCollection
from typing import List

from django_website.ImageProviders.ImageProvider import ImageProvider
from geojson import FeatureCollection
from typing import List
from django_website.Primitives.GeoImage import GeoImage

class ImageProviderManager(object):
    """Mediator class instantiated as a singleton responsible for managing all the image platforms adaptors implemented"""
    __instance = None
    def __init__(self):
        self._ImageProviders = {}
        for imageProviderClass in ImageProvider._subclasses:
            self.registerImageProvider(imageProviderClass)

    def __new__(cls):
        if ImageProviderManager.__instance is None:
            ImageProviderManager.__instance = object.__new__(cls)
        return ImageProviderManager.__instance

    def registerImageProvider(self, provider: ImageProvider):
        if not provider.imageProviderId in self._ImageProviders:
            self._ImageProviders[provider.imageProviderId] = provider
        pass


    def requestGeoImageToImageProvider(self, imageProviderId: str, locations: FeatureCollection) -> List[FeatureCollection]:
        """Delegate request to the selected image provider"""
        return self._ImageProviders[imageProviderId].getGeoImagesFromLocations(locations)
        
        

    @property
    def ImageProviders(self):
        return self._ImageProviders

    def getAvailableImageProviders(self):
        return {imageProviderId: {'name': self._ImageProviders[imageProviderId].imageProviderName, 'idprovider': imageProviderId} for imageProviderId in self._ImageProviders}

    def getImageForFeatureCollection(self, imageProviderId, featureCollection: FeatureCollection)->List[GeoImage]:
        return self._ImageProviders[imageProviderId].getImageForFeatureCollection(featureCollection)