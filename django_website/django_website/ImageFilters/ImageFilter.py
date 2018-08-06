from django_website.Primitives.GeoImage import GeoImage
from abc import ABC, abstractmethod

class ImageFilter(ABC):
    """abstract class describing the common interface to all Image Filter classes"""

    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        notImplementedFields = []
        checkFields = [
            (cls.filterName, 'mapMinerName'),
            (cls.filterId, 'mapMinerId'),
            (cls.processImage, 'processImage'),
            ]
        for i in range(len(checkFields)):
            try:
                if checkFields[i][0] is None:
                    notImplementedFields.append(checkFields[i][1])
            except NameError:
                notImplementedFields.append(checkFields[i][1])
        
        if len(notImplementedFields) > 0:
            errors = ", ".join(notImplementedFields)
            raise NotImplementedError("%s not defined in subclass: %s" % (errors, cls.__name__))
    
        cls._initialize(cls)
        pass

    __all__ = ["filterName", "filterId", "processImage"]

    """This property represents the filter's name that'll be displayed in the UI"""
    filterName = None
    
    """This property represents id used to catalog all available filters"""
    filterId = None

    @classmethod
    def _initialize(cls):
        pass  

    


