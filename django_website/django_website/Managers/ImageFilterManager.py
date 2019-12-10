from geojson import Polygon, Feature, FeatureCollection
from django_website.ImageFilters.ImageFilter import ImageFilter
from django_website.Primitives.GeoImage import GeoImage

from django.utils.translation import gettext

class ImageFilterManager(object):
    """
    ImageFilterManager: Responsible for keeping track of registered
    image filters and for encapsulating responses from requests delegated
    to them.
    """
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
        """
        Used during initialization to make some implemented
        image filter available to clients (e.g. front-end).

        Parameters
        ----------
        filter : ImageFilter
            The ImageFilter object, it should be a specialization
            of the class ImageFilter (e.g. GreeneryFilter)

        Returns
        -------
        none

        Raises
        ------
        KeyError
            when a key error
        OtherError
            when an other error
        """
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
    
    def processImageFromFeature(self, filterId, feature: Feature) -> Feature:
        if filterId in self._ImageFilters:
            return self._ImageFilters[filterId].processImageFromFeature(feature)
        else:
            return gettext("filterId not found!")
        pass


    
    