import traceback
from urllib.error import HTTPError

import imageio
import base64
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
from django.utils.translation import gettext as _, gettext_lazy
import sys

from GSVPanoramaManager.db import DBManager


class GreeneryFilter(ImageFilter):
    """Image filter for greenery objects in images"""

    filterName = gettext_lazy("Greenery")
    filterId = "greenery"

    @classmethod
    def _initialize(cls):
        pass

    @classmethod
    def _setOutput(cls, geoImage, featureLeaf, index):
        try:
            write_to_log('_setOutput')
            dbmanager = DBManager()
            result = dbmanager.load_processed_data_for_geoImage(
                geoImage,
                cls.filterId
                )
            if result:
                filter_result = result[0]
                geoImage.setProcessedData(
                    cls.filterId,
                    'base64',
                    result[1],
                    density=filter_result['density']
                )
            else:
                if geoImage.dataType == 'data:image/jpeg;base64':
                    base64decoded = base64.b64decode(geoImage.data)
                    ndarrayImage = img_as_float(imageio.imread(base64decoded))
                elif geoImage.dataType == 'URL':
                    ndarrayImage = img_as_float(imageio.imread(geoImage.data))

                mask = mt_li_espectral(ndarrayImage)
                density = np.count_nonzero(mask)/mask.size
                mask = img_as_ubyte(overlay_mask(ndarrayImage, mask))
                geoImage.setProcessedData(
                    cls.filterId, 'ndarray', mask, density=density)
                dbmanager.store_geoImage_as_view(geoImage)
            featureLeaf[index] = geoImage
            #dbmanager.store_geoImage_as_view(geoImage)
        except HTTPError:
            traceback.print_exc()
            write_to_log(f"Http error - Have the quota been achieved?")
        except ValueError:
            traceback.print_exc()
            write_to_log(f'Image bytes: {ndarrayImage[:100]}')
        except Exception as e:
            traceback.print_exc()
            write_to_log(f"Unexpected error: {sys.exc_info()[0]}")
            write_to_log(f"Error message: {e.args}")
            write_to_log(f'Offending url: {geoImage.data[:300]}')

    @classmethod
    def processImageFromFeatureCollection(cls, featureCollection: FeatureCollection) -> FeatureCollection:
        """Receives a feature collection of point/line or their multi equivalents and returns a list of GeoImage's"""

        for feature in featureCollection['features']:
            if feature['geometry']['type'] == 'MultiPolygon':
                # Number of Polygons
                for polygonIndex, polygon in enumerate(feature['geometry']['coordinates']):
                    for lineIndex, lineString in enumerate(polygon):
                        for coordinateIndex in range(len(lineString)):
                            geoImage = feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex]
                            if not isinstance(geoImage, dict):
                                continue
                            try:
                                geoImage = GeoImage.fromJSON(geoImage)
                            except JSONDecodeError:
                                print(
                                    _('Error while parsing panorama: ') + str(geoImage)[:100])
                            cls._setOutput(
                                geoImage, feature['properties']['geoImages'][polygonIndex][lineIndex], coordinateIndex)
            elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
                for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                    for coordinateIndex in range(len(lineString)):
                        try:
                            geoImage = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                            if not isinstance(geoImage, dict):
                                continue
                        except Exception:
                            raise Exception(
                                f'lineIndex: {lineIndex}, coordinateIndex: {coordinateIndex}')

                        try:
                            geoImage = GeoImage.fromJSON(geoImage)
                        except JSONDecodeError:
                            write_to_log(
                                _('Error while parsing panorama: ') + str(geoImage)[:100])
                        except Exception:
                            raise Exception(
                                f'lineIndex: {lineIndex}, coordinateIndex: {coordinateIndex}')
                        cls._setOutput(
                            geoImage, feature['properties']['geoImages'][lineIndex], coordinateIndex)
            elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
                for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                    geoImage = feature['properties']['geoImages'][coordinateIndex]
                    if not isinstance(geoImage, dict):
                        continue
                    try:
                        geoImage = GeoImage.fromJSON(geoImage)
                    except JSONDecodeError:
                        print(_('Error while parsing panorama: ') +
                              str(geoImage)[:100])
                    cls._setOutput(
                        geoImage, feature['properties']['geoImages'], coordinateIndex)
            elif feature['geometry']['type'] == 'Point':
                coordinateIndex = 0
                geoImage = feature['properties']['geoImages'][coordinateIndex]
                if not isinstance(geoImage, dict):
                    continue
                try:
                    geoImage = GeoImage.fromJSON(geoImage)
                except JSONDecodeError:
                    print(_('Error while parsing panorama: ') +
                          str(geoImage)[:100])
                cls._setOutput(
                    geoImage, feature['properties']['geoImages'], coordinateIndex)
        return featureCollection

    @classmethod
    def processImageFromFeature(cls, feature: Feature) -> Feature:
        """
        Receives a feature of point/line or their
        multi-equivalents and returns a list of GeoImage's
        """

        if feature['geometry']['type'] == 'MultiPolygon':
            # Number of Polygons
            for polygonIndex, polygon in enumerate(feature['geometry']['coordinates']):
                for lineIndex, lineString in enumerate(polygon):
                    for coordinateIndex in range(len(lineString)):
                        geoImage = feature['properties']\
                            ['geoImages'][polygonIndex]\
                            [lineIndex][coordinateIndex]
                        if not isinstance(geoImage, dict):
                            continue
                        try:
                            geoImage = GeoImage.fromJSON(geoImage)
                        except JSONDecodeError:
                            print(_('Error while parsing panorama: ') +
                                  str(geoImage)[:100])
                        cls._setOutput(
                            geoImage, feature['properties']\
                                ['geoImages'][polygonIndex]\
                                    [lineIndex], coordinateIndex)
        elif (feature['geometry']['type'] == 'MultiLineString')\
            or (feature['geometry']['type'] == 'Polygon'):
            for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                for coordinateIndex in range(len(lineString)):
                    try:
                        geoImage = feature['properties']\
                            ['geoImages'][lineIndex][coordinateIndex]
                        if not isinstance(geoImage, dict):
                            continue
                    except Exception:
                        raise Exception(
                            f'lineIndex: {lineIndex}, coordinateIndex: {coordinateIndex}')

                    try:
                        geoImage = GeoImage.fromJSON(geoImage)
                    except JSONDecodeError:
                        write_to_log(
                            _('Error while parsing panorama: ') + str(geoImage)[:100])
                    except Exception:
                        raise Exception(
                            f'lineIndex: {lineIndex}, coordinateIndex: {coordinateIndex}')
                    cls._setOutput(
                        geoImage, feature['properties']\
                            ['geoImages'][lineIndex], coordinateIndex)
        elif (feature['geometry']['type'] == 'LineString')\
            or (feature['geometry']['type'] == 'MultiPoint'):
            for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                geoImage = feature['properties']['geoImages'][coordinateIndex]
                if not isinstance(geoImage, dict):
                    continue
                try:
                    geoImage = GeoImage.fromJSON(geoImage)
                except JSONDecodeError:
                    print(_('Error while parsing panorama: ') +
                          str(geoImage)[:100])
                cls._setOutput(
                    geoImage, feature['properties']['geoImages'], coordinateIndex)
        elif feature['geometry']['type'] == 'Point':
            coordinateIndex = 0
            geoImage = feature['properties']['geoImages'][coordinateIndex]
            if isinstance(geoImage, dict):
                try:
                    geoImage = GeoImage.fromJSON(geoImage)
                except JSONDecodeError:
                    print(_('Error while parsing panorama: ') +
                          str(geoImage)[:100])
                cls._setOutput(
                    geoImage, feature['properties']['geoImages'], coordinateIndex)
        return feature

    def _processImageMock() -> GeoImage:
        imageMock = GeoImage(imageio.imread(
            'django_website/Testing/gsvimagetestmock.png'))
        mask = mt_li_espectral(imageMock.data)
        imageMock.data[~mask, 1:2] = .0
        imageMock.data[mask, 0] = .0
        imageMock.data[mask, 2] = .0
        retimg = imageMock.data
        return retimg
