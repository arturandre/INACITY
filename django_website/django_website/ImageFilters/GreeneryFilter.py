import imageio
import scipy
import numpy as np
from skimage import color, img_as_float, img_as_ubyte

import matplotlib.pyplot as plt
from scipy import misc, ndimage
import json

from .ImageFilter import *
from .commonFunctions import mt_li_espectral, overlay_mask
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
        geoImage.data = img_as_ubyte(overlay_mask(geoImage.data, mask))
        return geoImage

    def processImageFromFeatureCollection(featureCollection: FeatureCollection) -> FeatureCollection:
        """Receives a feature collection of point/line or their multi equivalents and returns a list of GeoImage's"""

        for feature in featureCollection['features']:
            if feature['geometry']['type'] == 'MultiPolygon':
                #Number of Polygons
                for polygonIndex, polygon in enumerate(feature['geometry']['coordinates']):
                    for lineIndex, lineString in enumerate(polygon):
                        for coordinateIndex in range(len(lineString)):
                            geoImage = feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex]
                            try:
                                geoImage = GeoImage.fromJSON(json.loads(geoImage))
                            except JSONDecodeError:
                                print('Error while parsing panorama: ' + str(geoImage)[:100]);
                                mask = mt_li_espectral(geoImage.data)
                                mask = img_as_ubyte(overlay_mask(geoImage.data, mask))
                            #geoImage.processedData[GreeneryFilter.filterId] = mask
                            geoImage.setProcessedData(GreeneryFilter.filterId, 'ndarray', mask)
                            feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex] = geoImage.toJSON()
            elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
                for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                    for coordinateIndex in range(len(lineString)):
                        geoImage = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                        try:
                            geoImage = GeoImage.fromJSON(json.loads(geoImage))
                        except JSONDecodeError:
                            print('Error while parsing panorama: ' + str(geoImage)[:100]);
                        mask = mt_li_espectral(geoImage.data)
                        mask = img_as_ubyte(overlay_mask(geoImage.data, mask))
                        #geoImage.processedData[GreeneryFilter.filterId] = mask
                        geoImage.setProcessedData(GreeneryFilter.filterId, 'ndarray', mask)
                        feature['properties']['geoImages'][lineIndex][coordinateIndex] = geoImage.toJSON()
            elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
                for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                    geoImage = feature['properties']['geoImages'][coordinateIndex]
                    try:
                        geoImage = GeoImage.fromJSON(json.loads(geoImage))
                    except JSONDecodeError:
                        print('Error while parsing panorama: ' + str(geoImage)[:100]);
                    mask = mt_li_espectral(geoImage.data)
                    mask = img_as_ubyte(overlay_mask(geoImage.data, mask))
                    #geoImage.processedData[GreeneryFilter.filterId] = mask
                    geoImage.setProcessedData(GreeneryFilter.filterId, 'ndarray', mask)
                    feature['properties']['geoImages'][coordinateIndex] = geoImage.toJSON()
            elif feature['geometry']['type'] == 'Point':
                coordinateIndex = 0
                geoImage = feature['properties']['geoImages'][coordinateIndex]
                try:
                    geoImage = GeoImage.fromJSON(json.loads(geoImage))
                except JSONDecodeError:
                    print('Error while parsing panorama: ' + str(geoImage)[:100]);
                mask = mt_li_espectral(geoImage.data)
                mask = img_as_ubyte(overlay_mask(geoImage.data, mask))
                #geoImage.processedData[GreeneryFilter.filterId] = mask
                geoImage.setProcessedData(GreeneryFilter.filterId, 'ndarray', mask)
                feature['properties']['geoImages'][coordinateIndex] = geoImage.toJSON()
        return featureCollection


    def _processImageMock() -> GeoImage:
        imageMock = GeoImage(imageio.imread('django_website/Testing/gsvimagetestmock.png'))
        mask = mt_li_espectral(imageMock.data)
        imageMock.data[~mask, 1:2] = .0
        imageMock.data[mask, 0] = .0
        imageMock.data[mask, 2] = .0
        retimg = imageMock.data
        return retimg