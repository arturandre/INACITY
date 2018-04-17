from django_website.Primitives.Primitives import ImageDTO
from abc import ABC, abstractmethod

class ImageFilter(ABC):
    """abstract class describing the common interface to all Image Filter classes"""
    def __init__(self):
        pass

    @property
    @abstractmethod
    def filterName(self):
        """This property represents the filter's name that'll be used in the UI"""
        pass

    @property
    @abstractmethod
    def filterId(self):
        """This property represents id used to catalog all available filters"""
        pass

    @abstractmethod
    def processImage(self, image: ImageDTO) -> ImageDTO:
        pass

    


