import sys
sys.path.insert(0, '../Primitives')

import Bound, StreetDTO, AmenityDTO

from typing import List

class MapMiner:
    """Abstract class representing a Map Miner to collect data from some GIS (Geographic Information System)."""
    def __init__(self):
        raise NotImplementedError( "Abstract classes cannot be instantiated." )
    def getStreets(region: Bound) -> List[type(StreetDTO)]:
        raise NotImplementedError( "Not implemented." )

    def getAmenities(region: Bound, amenityType) -> List[type(AmenityDTO)]:
        raise NotImplementedError( "Not implemented." )