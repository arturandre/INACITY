from geojson import Polygon, Feature, FeatureCollection
from django_website.ImageFilters.ImageFilter import ImageFilter
from django_website.Primitives.GeoImage import GeoImage

from django.utils.translation import gettext

class ImageFilterManager(object):
    __instance__ = None
    def __init__(self):
        self._ImageFilters = {}
        for filterClass in ImageFilter._subclasses:
            self.registerFilter(filterClass)

    def __new__(cls):
        if ImageFilterManager.__instance__ is None:
            ImageFilterManager.__instance__ = object.__new__(cls)
        return ImageFilterManager.__instance__

    def registerFilter(self, filter: ImageFilter):
        if not filter.filterId in self._ImageFilters:
            self._ImageFilters[filter.filterId] = filter
        pass

    def getAvailableImageFilters(self):
        return [{'name': self._ImageFilters[filterId].filterName, 'id': filterId} for filterId in self._ImageFilters]   

    def processImageFromFeatureCollection(self, filterId, featureCollection: FeatureCollection) -> FeatureCollection:
        if filterId in self._ImageFilters:
            return self._ImageFilters[filterId].processImageFromFeatureCollection(featureCollection)
        else:
            return gettext("filterId not found!")
        pass


    
    