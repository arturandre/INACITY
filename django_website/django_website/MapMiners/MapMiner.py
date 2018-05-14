from django_website.Primitives.Primitives import *
from abc import ABC, abstractmethod
from typing import List
from django.contrib.gis.geos import Polygon

class MapMiner(ABC):
    """Abstract class representing a Map Miner adapter to collect data from some GIS (Geographic Information System)."""

    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        notImplementedFields = []
        checkFields = [
            (cls.mapMinerName, 'mapMinerName'),
            (cls.mapMinerId, 'mapMinerId'),
            ]
        for i in range(len(checkFields)):
            try:
                if checkFields[i][0] is None:
                    notImplementedFields.append(checkFields[i][1])
            except NameError:
                notImplementedFields.append(checkFields[i][1])
        
        if len(notImplementedFields) > 0:
            errors = ", ".join(notImplementedFields)
            raise NotImplementedError("%s not defined in subclass: %s" (errors, cls.__name__))
        

    def __init__(self):
        pass

    __all__ = ["mapMinerName", "mapMinerId", "getAvailableQueries", "getAmenities"]

    """This property represents the filter's name that'll be displayed in the UI"""
    mapMinerName = None

    """This property represents id used to catalog all available filters"""
    mapMinerId = None
    
    @abstractmethod
    def _availableQueries():
        pass
    
    @abstractmethod
    def getAvailableQueries():
        pass

    @abstractmethod
    def doQuery(queryName: str, region: Polygon):
        pass
    
    #@abstractmethod
    #def getStreets(region: Polygon) -> List[type(StreetDTO)]:
    #    pass

    @abstractmethod
    def getAmenities(region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        pass
