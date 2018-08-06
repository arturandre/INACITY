from django_website.ImageFilters.ImageFilter import ImageFilter
from django_website.Primitives.Primitives import GeoImage

class ImageFilterManager(object):
    __instance = None
    def __init__(self):
        self._ImageFilters = {}
        for filterClass in ImageFilter._subclasses:
            self.registerFilter(filterClass)

    def __new__(cls):
        if ImageFilterManager.__instance is None:
            ImageFilterManager.__instance = object.__new__(cls)
        return ImageFilterManager.__instance

    def registerFilter(self, filter: ImageFilter):
        if not filter.filterId in self._ImageFilters:
            self._ImageFilters[filter.filterId] = filter
        pass

    def processImage(self, filterId, geoImage: GeoImage):
        if filterId in self._ImageFilters:
            return self._ImageFilters[filterId].processImage(geoImage)
        else:
            return "filterId not found!"
        pass

    def getAvailableImageFilters(self):
        return {imageFilter.filterId: {'name': self._ImageFilters[filterId].filterName, 'id': imageFilter.filterId} for imageFilter in self._ImageFilters}

    
    