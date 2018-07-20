from django_website.Primitives.Primitives import GeoImage
from abc import ABC, abstractmethod
from typing import List
from geojson import FeatureCollection

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

    @abstractmethod
    def getImageForFeatureCollection(location: FeatureCollection)->List[GeoImage]:
        """An image provider coupled with a GIS must be able to get images by coordinates"""
        pass