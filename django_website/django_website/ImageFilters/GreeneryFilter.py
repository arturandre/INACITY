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
    

    filterName = "Greenery"
    filterId = "Greenery"

    #Based on mt-li-espectral
    def processImage(image: ImageDTO) -> ImageDTO:
        mask = mt_li_espectral(image.data)
        return ImageDTO(mask)

    def _processImageMock() -> ImageDTO:
        imageMock = ImageDTO(imageio.imread('django_website/Testing/gsvimagetestmock.png'))
        mask = mt_li_espectral(imageMock.data)
        imageMock.data[~mask, 1:2] = .0
        imageMock.data[mask, 0] = .0
        imageMock.data[mask, 2] = .0
        retimg = imageMock.data
        return retimg