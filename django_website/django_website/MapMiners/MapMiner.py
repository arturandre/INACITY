from django_website.Primitives.Primitives import *
from abc import ABC, abstractmethod
from typing import List

class MapMiner(ABC):
    """Abstract class representing a Map Miner adapter to collect data from some GIS (Geographic Information System)."""

    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        if cls.mapMinerName is None:
            raise NotImplementedError("mapMinerName not defined in subclass: " + cls.__name__)
        if cls.mapMinerId is None:
            raise NotImplementedError("mapMinerId not defined in subclass: " + cls.__name__)

    def __init__(self):
        pass

    __all__ = ["mapMinerName", "mapMinerId", "getStreets", "getAmenities"]

    """This property represents the filter's name that'll be displayed in the UI"""
    mapMinerName = None

    """This property represents id used to catalog all available filters"""
    mapMinerId = None

    @abstractmethod
    def getStreets(region: Bound) -> List[type(StreetDTO)]:
        pass

    @abstractmethod
    def getAmenities(region: Bound, amenityType) -> List[type(AmenityDTO)]:
        pass
