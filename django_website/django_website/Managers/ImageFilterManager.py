from geojson import Polygon, Feature, FeatureCollection
from django_website.ImageFilters.ImageFilter import ImageFilter
from django_website.Primitives.GeoImage import GeoImage

from django.utils.translation import gettext as _

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

    def processImageFromFeatureCollection(self, filterId, featureCollection: FeatureCollection):
        if filterId in self._ImageFilters:
            return self._ImageFilters[filterId].processImageFromFeatureCollection(featureCollection)
        else:
            return _("filterId not found!")
        pass

    def getAvailableImageFilters(self):
        return {filterId: {'name': self._ImageFilters[filterId].filterName, 'id': filterId} for filterId in self._ImageFilters}

    
    