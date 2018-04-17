from .ImageFilter import *
from django_website.Primitives.Primitives import ImageDTO

class GreeneryFilter(ImageFilter):
    """Image filter for greenery objects in images"""

    def __init__(self):
        return super().__init__()

    def filterName(self):
        return "Greenery"
        pass

    @property
    @abstractmethod
    def filterId(self):
        return "Greenery"

    def processImage(self, image: ImageDTO) -> ImageDTO:
        return ImageDTO()
