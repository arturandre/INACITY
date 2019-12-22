from geojson import Polygon, FeatureCollection
from typing import List

from django_website.ImageProviders.ImageProvider import ImageProvider
from geojson import FeatureCollection, Feature
from typing import List
from django_website.Primitives.GeoImage import GeoImage
from django_website.LogGenerator import write_to_log

class ImageProviderManager(object):
    """Mediator class instantiated as a singleton responsible for managing all the image platforms adaptors implemented"""
    __instance = None
    def __init__(self):
        write_to_log('ImageProviderManager.__init__')
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

    @property
    def ImageProviders(self):
        
        return self._ImageProviders

    def getAvailableImageProviders(self):
        return [{'name': self._ImageProviders[imageProviderId].imageProviderName, 'id': imageProviderId} for imageProviderId in self._ImageProviders]

    def getImageForFeatureCollection(self, imageProviderId, featureCollection: FeatureCollection)->FeatureCollection:
        return self._ImageProviders[imageProviderId].getImageForFeatureCollection(featureCollection)

    def getImageForFeature(self, imageProviderId, feature: Feature)->Feature:
        return self._ImageProviders[imageProviderId].getImageForFeature(feature)