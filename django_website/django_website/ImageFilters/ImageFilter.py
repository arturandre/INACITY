from django_website.Primitives.Primitives import GeoImage
from abc import ABC, abstractmethod

class ImageFilter(ABC):
    """abstract class describing the common interface to all Image Filter classes"""

    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        if cls.filterName is None:
            raise NotImplementedError("filterName not defined in subclass: " + cls.__name__)
        if cls.filterId is None:
            raise NotImplementedError("filterId not defined in subclass: " + cls.__name__)

    __all__ = ["filterName", "filterId", "processImage"]

    """This property represents the filter's name that'll be displayed in the UI"""
    filterName = None
    
    """This property represents id used to catalog all available filters"""
    filterId = None

    @abstractmethod
    def processImage(self, image: GeoImage) -> GeoImage:
        pass

    


