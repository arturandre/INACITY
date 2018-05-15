from django_website.Primitives.Primitives import *
from abc import ABC, abstractmethod
from typing import List
from django.contrib.gis.geos import Polygon
from geojson import FeatureCollection

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
            (cls._availableQueries, '_availableQueries'),
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
        
    __all__ = ["mapMinerName", "mapMinerId", "getAmenities"]

    """This property represents the filter's name that'll be displayed in the UI"""
    mapMinerName = None

    """This property represents id used to catalog all available filters"""
    mapMinerId = None

    """This property represents the possible queries the user can make to a specific MapMiner"""
    _availableQueries = None    

    @classmethod
    def getAvailableQueries(cls):
        """Registry of available queries to any clients (i.e. frontend)"""
        return [query for query in cls._availableQueries]
    
    @classmethod
    def doQuery(cls, queryName: str, regions: FeatureCollection):
        """Execute a queries registered query"""
        if not type(regions) is FeatureCollection: regions = FeatureCollection(regions)
        if not type(regions['features']) is list: regions['features'] = [regions['features']]
        
        return cls._availableQueries[queryName](cls._preFormatInput(regions))

    def _preFormatInput(GeoJsonInput: FeatureCollection):
        return GeoJsonInput

    @abstractmethod
    def getAmenities(region: Polygon, amenityType) -> List[type(AmenityDTO)]:
        pass

    

    
    