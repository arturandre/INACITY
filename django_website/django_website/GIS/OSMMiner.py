#from django_website.GIS.MapMiner import *
from .MapMiner import *


class OSMMiner(MapMiner):
    def __init__(self):
        return super().__init__()

    """OpenStreetMaps miner"""
    def getStreets(region: Bound) -> List[type(StreetDTO)]:
        raise NotImplementedError( "Not implemented." )

    def getAmenities(region: Bound, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError( "Not implemented." )

    

