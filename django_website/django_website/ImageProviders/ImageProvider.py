from django_website.Primitives.GeoImage import GeoImage
from abc import ABC, abstractmethod
from typing import List
from geojson import FeatureCollection, Feature

class ImageProvider(ABC):
    """abstract class describing the common interface to all Image Providers classes"""

    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        if cls.imageProviderName is None:
            raise NotImplementedError("imageProviderName not defined in subclass: " + cls.__name__)
        if cls.imageProviderId is None:
            raise NotImplementedError("imageProviderId not defined in subclass: " + cls.__name__)

    def __init__(self):
        pass

    __all__ = ["imageProviderName", "imageProviderId", "getImageForFeatureCollection"]

    imageProviderName = None
    imageProviderId = None

    @staticmethod
    @abstractmethod
    def getImageForFeatureCollection(location: FeatureCollection)->FeatureCollection:
        """An image provider coupled with a GIS must be able to get images by coordinates"""
        pass


    @staticmethod
    @abstractmethod
    def getImageForFeature(location: Feature)->Feature:
        """An image provider coupled with a GIS must be able to get images by coordinates"""
        pass

    @staticmethod
    def traverseFeature(feature, cfunction, pointAtCoordinate=False):
        cloneTree = []
        if type(feature) is list:
            coordinatesRoot = feature
        else:
            coordinatesRoot = feature['geometry']['coordinates']
        if type(coordinatesRoot[0]) is not list:
            #the feature is a point
            cloneTree.append(cfunction(coordinatesRoot, pointAtCoordinate))
        else:
            for j in range(len(coordinatesRoot)):
                if type(coordinatesRoot[j][0]) is list:
                    cloneTree.append(ImageProvider.traverseFeature(coordinatesRoot[j], cfunction, pointAtCoordinate))
                else:
                    cloneTree.append(cfunction(coordinatesRoot[j], pointAtCoordinate))
        return cloneTree

    

    @staticmethod
    def traverseFeatureCollection(featureCollection, ffunction, cfunction):
        for feature in featureCollection['features']:
            clonedTree = ImageProvider.traverseFeature(feature, cfunction)
            ffunction(feature, clonedTree)

        pass
