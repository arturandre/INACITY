#import sys
#sys.path.insert(0, '../Primitives')

from django_website.Primitives.Primitives import *

from typing import List
from abc import ABC, abstractmethod

class MapMiner(ABC):
    """Abstract class representing a Map Miner to collect data from some GIS (Geographic Information System)."""
    def __init__(self):
        pass

    @abstractmethod
    def getStreets(region: Bound) -> List[type(StreetDTO)]:
        pass
        #raise NotImplementedError( "Not implemented." )

    @abstractmethod
    def getAmenities(region: Bound, amenityType) -> List[type(AmenityDTO)]:
        pass
        #raise NotImplementedError( "Not implemented." )