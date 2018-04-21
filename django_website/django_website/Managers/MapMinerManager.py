#from django_website.GIS.MapMiner import MapMiner
from typing import List

class MapMinerManager:
    ImageMiners = List[type(ImageMiner)] = []

    def addMiner(miner: ImageMiner):
        ImageMiners.append(miner)

    def __init__(self):        
        print("MapMinerManager instantiated");

xpto = MapMinerManager()
print(MapMinerManager.MapMiners)