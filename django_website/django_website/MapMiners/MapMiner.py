from django_website.Primitives.GeoImage import GeoImage
from abc import ABC, abstractmethod
from typing import List
from django.contrib.gis.geos import Polygon
from geojson import FeatureCollection
from django.contrib.gis.gdal import SpatialReference, CoordTransform


class MapMiner(ABC):
    """
    Abstract class representing a Map Miner
    adapter to collect data from some GIS
    (Geographic Information System).


    fields:
        _destcrs = SpatialReference(3857)
            Destination Coordinates Reference System used to convert
            a distinct Source Coordinate System (SRS) to the adopted
            default (from OpenStreetMap).
        _subclasses : List[MapMiner]
            Contains a list of every subclass of MapMiner.
            Filled dynamically.

    """
    _destcrs = SpatialReference(3857) # OpenLayers defauls srid
    _subclasses = []
    def __init_subclass__(cls, **kwargs):
        """
        This subclass initializer will be responsible for
        registering all the subclasses from MapMiner.
        Besides simple checks are done here in order
        to assure the presence of expected
        properties such as:

        'mapMinerName' : str
            Used to display the MapMiner in the front-end.
        'mapMinerId' : str
            Used as identifier of the mapMiner in the
            back-end by the MapMinerManager.
        '_availableQueries' : dict[str, callback]
            Used to map which kinds of queries the mapMiner
            supports, for example the OSMMiner
            has _availableQueries = {'Streets': _getStreets})
        '_destcrs' : SpatialReference(3857)

        Parameters
        ----------
        x : dict
            A simple dict object
        y : dict
            A simple dict object

        Returns
        -------
        dict object with keys from both initial dict objects
        """
        super().__init_subclass__(**kwargs)
        cls._subclasses.append(cls)
        notImplementedFields = []
        checkFields = [
            (cls.mapMinerName, 'mapMinerName'),
            (cls.mapMinerId, 'mapMinerId'),
            (cls._availableQueries, '_availableQueries'),
            (cls._destcrs, '_destcrs'),
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
    
    __all__ = ["mapMinerName", "mapMinerId", "getAmenities"]

    """This property represents the filter's name that'll be displayed in the UI"""
    mapMinerName = None

    """This property represents id used to catalog all available filters"""
    mapMinerId = None

    """This property represents the possible queries the user can make to a specific MapMiner"""
    _availableQueries = None    

    """This property represents the source GIS srid"""
    _basecrs = None

    @classmethod
    def _initialize(cls):
        pass

    @classmethod
    def getAvailableQueries(cls):
        """Registry of available queries to any clients (i.e. frontend)"""
        return [query for query in cls._availableQueries]
    
    @classmethod
    def doQuery(cls, queryName: str, regions: FeatureCollection):
        """Execute a registered query"""
        if not type(regions) is FeatureCollection: regions = FeatureCollection(regions)
        if not type(regions['features']) is list: regions['features'] = [regions['features']]
        print(cls._availableQueries)
        print(regions)
        results = cls._availableQueries[queryName](cls._preFormatInput(regions))
        print(results)
        return results

    @classmethod
    def _reproject(cls, geosobject):
        trans = CoordTransform(cls._basecrs, MapMiner._destcrs)
        return geosobject.transform(trans)

    @classmethod
    def _preFormatInput(cls, GeoJsonInput: FeatureCollection):
        return GeoJsonInput




    

    
    