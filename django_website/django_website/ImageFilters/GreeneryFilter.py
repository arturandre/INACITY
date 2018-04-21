import imageio
import scipy
import numpy as np
from skimage import color

import matplotlib.pyplot as plt
from scipy import misc, ndimage

from .ImageFilter import *
from .commonFunctions import mt_li_espectral
from django_website.Primitives.Primitives import ImageDTO


class GreeneryFilter(ImageFilter):
    """Image filter for greenery objects in images"""

    def __init__(self):
        return super().__init__()

    @property
    def filterName(self):
        return "Greenery"
        pass

    @property
    def filterId(self):
        return "Greenery"

    #Based on mt-li-espectral
    def processImage(self, image: ImageDTO) -> ImageDTO:
        mask = mt_li_espectral(image.data)
        return ImageDTO()
