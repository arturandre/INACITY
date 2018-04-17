#import sys
#sys.path.insert(0, '../GIS')

from django_website.GIS.MapMiner import MapMiner
from typing import List

class MapMinerManager:
    MapMiners = List[type(MapMiner)] = []

    def addMiner(miner: MapMiner):
        MapMiners.append(miner)

    def __init__(self):        
        print("MapMinerManager instantiated");

xpto = MapMinerManager()
print(MapMinerManager.MapMiners)