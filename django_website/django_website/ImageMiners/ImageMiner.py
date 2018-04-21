from django_website.Primitives.Primitives import ImageDTO
from abc import ABC, abstractmethod

class ImageMiner(ABC):
    """abstract class describing the common interface to all Image Providers classes"""
    def __init__(self):
        pass

    __all__ = ["minerName", "minerId", "getImageFromLocation"]

    @property
    @abstractmethod
    def minerName(self):
        """This property represents the image provider's name that'll be displayed in the UI"""
        pass

    @property
    @abstractmethod
    def minerId(self):
        """This property represents id used to catalog all available image providers"""
        pass

    @abstractmethod
    def getImageFromLocation(self, location):
        """An image provider coupled with a GIS must be able to get images by coordinates"""
        pass