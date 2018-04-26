from django_website.MapMiners.MapMiner import MapMiner

class MapMinerManager(object):
    __instance = None
    def __init__(self):
        self._MapMiners = {}
        for mapMinerClass in MapMiner._subclasses:
            self.registerMapMiner(mapMinerClass)

    def __new__(cls):
        if MapMinerManager.__instance is None:
            MapMinerManager.__instance = object.__new__(cls)
        return MapMinerManager.__instance

    def registerMapMiner(self, mapMiner: MapMiner):
        if mapMiner.mapMinerName in self._MapMiners:
          return
        self._MapMiners[mapMiner.mapMinerName] = mapMiner

    @property
    def MapMiners(self):
        return self._MapMiners

#xpto = MapMinerManager()
#print(MapMinerManager.MapMiners)