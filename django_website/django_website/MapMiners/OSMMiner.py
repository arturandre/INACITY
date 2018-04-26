#from django_website.GIS.MapMiner import *
from .MapMiner import *


class OSMMiner(MapMiner):
    """OpenStreetMaps miner"""

    def __init__(self):
        super().__init__()

    mapMinerName = "OSMMiner"
    
    mapMinerId = "osm"
    
    def getStreets(region: Bound) -> List[type(StreetDTO)]:
        raise NotImplementedError( "Not implemented." )

    def getAmenities(region: Bound, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError( "Not implemented." )

    

