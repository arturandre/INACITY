from django_website.Primitives.Primitives import ImageDTO
from abc import ABC, abstractmethod

class ImageMiner(ABC):
    """abstract class describing the common interface to all Image Providers classes"""

    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        if cls.imageMinerName is None:
            raise NotImplementedError("imageMinerName not defined in subclass: " + cls.__name__)
        if cls.imageMinerId is None:
            raise NotImplementedError("imageMinerId not defined in subclass: " + cls.__name__)

    def __init__(self):
        pass

    __all__ = ["imageMinerName", "imageMinerId", "getImageFromLocation"]

    imageMinerName = None
    imageMinerId = None

    @abstractmethod
    def getImageFromLocation(self, location):
        """An image provider coupled with a GIS must be able to get images by coordinates"""
        pass