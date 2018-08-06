import imageio
import scipy
import numpy as np
from skimage import color, img_as_float, img_as_ubyte

import matplotlib.pyplot as plt
from scipy import misc, ndimage

from .ImageFilter import *
from .commonFunctions import mt_li_espectral
from django_website.Primitives.GeoImage import GeoImage


class GreeneryFilter(ImageFilter):
    """Image filter for greenery objects in images"""
    

    filterName = "Greenery"
    filterId = "greenery"

    def _initialize(cls):
        pass

    #Based on mt-li-espectral
    def processImage(geoImage: GeoImage) -> GeoImage:
        mask = mt_li_espectral(geoImage.data)
        geoImage.data = img_as_ubyte(mask)
        return geoImage

    def _processImageMock() -> GeoImage:
        imageMock = GeoImage(imageio.imread('django_website/Testing/gsvimagetestmock.png'))
        mask = mt_li_espectral(imageMock.data)
        imageMock.data[~mask, 1:2] = .0
        imageMock.data[mask, 0] = .0
        imageMock.data[mask, 2] = .0
        retimg = imageMock.data
        return retimg