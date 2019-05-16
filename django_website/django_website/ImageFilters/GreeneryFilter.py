import imageio
import scipy
import numpy as np
from skimage import color, img_as_float, img_as_ubyte

import matplotlib.pyplot as plt
from scipy import misc, ndimage
import json
from json import JSONDecodeError
from geojson import Point, MultiPoint, LineString, MultiLineString, Feature, FeatureCollection

from .ImageFilter import ImageFilter
from .commonFunctions import mt_li_espectral, overlay_mask
from django_website.Primitives.GeoImage import GeoImage, CustomJSONEncoder
from django_website.LogGenerator import write_to_log
from django.utils.translation import gettext as _


class GreeneryFilter(ImageFilter):
    """Image filter for greenery objects in images"""
    

    filterName = _("Greenery")
    filterId = "greenery"

    @classmethod
    def _initialize(cls):
        pass

    @classmethod
    def _setOutput(cls, geoImage, featureLeaf, index):
        ndarrayImage = img_as_float(imageio.imread(geoImage.data))
        mask = mt_li_espectral(ndarrayImage)
        density = np.count_nonzero(mask)/mask.size
        mask = img_as_ubyte(overlay_mask(ndarrayImage, mask))
        geoImage.setProcessedData(cls.filterId, 'ndarray', mask, density=density)
        featureLeaf[index] = geoImage
        #print(json.dumps(geoImage.processedDataList, cls=CustomJSONEncoder))

    @classmethod
    def processImageFromFeatureCollection(cls, featureCollection: FeatureCollection) -> FeatureCollection:
        """Receives a feature collection of point/line or their multi equivalents and returns a list of GeoImage's"""

        for feature in featureCollection['features']:
            if feature['geometry']['type'] == 'MultiPolygon':
                #Number of Polygons
                for polygonIndex, polygon in enumerate(feature['geometry']['coordinates']):
                    for lineIndex, lineString in enumerate(polygon):
                        for coordinateIndex in range(len(lineString)):
                            geoImage = feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex]
                            try:
                                geoImage = GeoImage.fromJSON(geoImage)
                            except JSONDecodeError:
                                print(_('Error while parsing panorama: ') + str(geoImage)[:100])
                            cls._setOutput(geoImage, feature['properties']['geoImages'][polygonIndex][lineIndex], coordinateIndex)
                            #ndarrayImage = img_as_float(imageio.imread(geoImage.data))
                            #mask = mt_li_espectral(ndarrayImage)
                            #mask = img_as_ubyte(overlay_mask(ndarrayImage, mask))
                            #geoImage.setProcessedData(cls.filterId, 'ndarray', mask)
                            #feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex] = geoImage
            elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
                for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                    for coordinateIndex in range(len(lineString)):
                        #geoImage = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                        try:
                            geoImage = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                        except Exception as exception:
                            raise Exception(f'lineIndex: {lineIndex}, coordinateIndex: {coordinateIndex}')

                        try:
                            geoImage = GeoImage.fromJSON(geoImage)
                        except JSONDecodeError:
                            print(_('Error while parsing panorama: ') + str(geoImage)[:100])
                        cls._setOutput(geoImage, feature['properties']['geoImages'][lineIndex], coordinateIndex)
                        #ndarrayImage = img_as_float(imageio.imread(geoImage.data))
                        #mask = mt_li_espectral(ndarrayImage)
                        #mask = img_as_ubyte(overlay_mask(ndarrayImage, mask))
                        #geoImage.setProcessedData(cls.filterId, 'ndarray', mask)
                        #feature['properties']['geoImages'][lineIndex][coordinateIndex] = geoImage.__dict__
            elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
                for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                    geoImage = feature['properties']['geoImages'][coordinateIndex]
                    try:
                        geoImage = GeoImage.fromJSON(geoImage)
                    except JSONDecodeError:
                        print(_('Error while parsing panorama: ') + str(geoImage)[:100])
                    cls._setOutput(geoImage, feature['properties']['geoImages'], coordinateIndex)
                    #ndarrayImage = img_as_float(imageio.imread(geoImage.data))
                    #mask = mt_li_espectral(ndarrayImage)
                    #mask = img_as_ubyte(overlay_mask(ndarrayImage, mask))
                    #geoImage.setProcessedData(cls.filterId, 'ndarray', mask)
                    #feature['properties']['geoImages'][coordinateIndex] = geoImage
            elif feature['geometry']['type'] == 'Point':
                coordinateIndex = 0
                geoImage = feature['properties']['geoImages'][coordinateIndex]
                try:
                    geoImage = GeoImage.fromJSON(geoImage)
                except JSONDecodeError:
                    print(_('Error while parsing panorama: ') + str(geoImage)[:100])
                cls._setOutput(geoImage, feature['properties']['geoImages'], coordinateIndex)
                #ndarrayImage = img_as_float(imageio.imread(geoImage.data))
                #mask = mt_li_espectral(ndarrayImage)
                #mask = img_as_ubyte(overlay_mask(ndarrayImage, mask))
                ##geoImage.processedData[GreeneryFilter.filterId] = mask
                #geoImage.setProcessedData(cls.filterId, 'ndarray', mask)
                #feature['properties']['geoImages'][coordinateIndex] = geoImage
        return featureCollection


    def _processImageMock() -> GeoImage:
        imageMock = GeoImage(imageio.imread('django_website/Testing/gsvimagetestmock.png'))
        mask = mt_li_espectral(imageMock.data)
        imageMock.data[~mask, 1:2] = .0
        imageMock.data[mask, 0] = .0
        imageMock.data[mask, 2] = .0
        retimg = imageMock.data
        return retimg