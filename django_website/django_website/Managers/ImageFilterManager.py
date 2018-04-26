from django_website.ImageFilters.ImageFilter import ImageFilter

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
        if filter.filterName in self._ImageFilters:
          return
        self._ImageFilters[filter.filterName] = filter
    @property
    def ImageFilters(self):
        return self._ImageFilters
    