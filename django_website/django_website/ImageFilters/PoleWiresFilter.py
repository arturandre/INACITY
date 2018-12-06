#imports from Keras package
from keras.models import model_from_json
from keras.layers import Conv2D
from keras.layers import MaxPooling2D
from keras.layers import Flatten
from keras.layers import Dense
from keras.preprocessing import image
##skimage
from skimage import data, exposure, img_as_float, color,io

##GeoJson, GeoImage and json
from geojson import Point, MultiPoint, LineString, MultiLineString, Feature, FeatureCollection
from django_website.Primitives.GeoImage import GeoImage
from json import JSONDecodeError

from matplotlib import pyplot as plt
from PIL import Image

from .ImageFilter import ImageFilter

import numpy as np

class PoleWiresFilter(ImageFilter):
    #Based on Keras deep learning package
    filterName = "PoleWires"
    filterId = "PoleWires"

    #Load PoleWiresModel
    json_file = open('PoleWiresModel.json', 'r')
    loaded_model_json = json_file.read()
    json_file.close()
    loaded_model = model_from_json(loaded_model_json)
    # load weights into new model
    loaded_model.load_weights("PoleWiresModel.h5")

    @classmethod
    def _initialize(cls):
        pass

    @classmethod
    def _preProcessGeoImageData(cls, geoImageData):
        tmp = Image.fromarray(geoImageData)
        tmp = exposure.equalize_hist(tmp)
        tmp = image.load_img(tmp, target_size = (64,64))
        tmp = image.img_to_array(tmp)
        tmp = np.expand_dims(tmp, axis = 0)
        return tmp
    
    @classmethod
    def processImage(cls, geoImage: GeoImage):
        #test
        entry = geoImage.data
        tmp = Image.fromarray(entry)
        img = exposure.equalize_hist(tmp)
        test_image = image.load_img(img, target_size = (64,64))
        test_image = image.img_to_array(test_image)
        test_image = np.expand_dims(test_image, axis = 0)
        result = PoleWiresFilter.loaded_model.predict(test_image)
        PoleWiresFilter.training_set.class_indices
        return result

    @classmethod
    def _setOutput(cls, geoImage, featureLeaf, index):
        normalizedRescaledImage = PoleWiresFilter._preProcessGeoImageData(geoImage.data)
        result = PoleWiresFilter.loaded_model.predict(normalizedRescaledImage)
        geoImage.setProcessedData(cls.filterId, isPresent=(result[0][0] > result[0][1]))
        featureLeaf[index] = geoImage

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
                                print('Error while parsing panorama: ' + str(geoImage)[:100])
                            cls._setOutput(geoImage, feature['properties']['geoImages'][polygonIndex][lineIndex], coordinateIndex)
                                #normalizedRescaledImage = _preProcessGeoImageData(geoImage.data)
                                #result = loaded_model.predict(normalizedRescaledImage)
                                #geoImage.setProcessedData(PoleWiresFilter.filterId, '', result)
            elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
                for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                    for coordinateIndex in range(len(lineString)):
                        geoImage = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                        try:
                            geoImage = GeoImage.fromJSON(geoImage)
                        except JSONDecodeError:
                            print('Error while parsing panorama: ' + str(geoImage)[:100])
                        cls._setOutput(geoImage, feature['properties']['geoImages'][lineIndex], coordinateIndex)
                        #entry = geoImage.data
                        #tmp = Image.fromarray(entry)
                        #img = exposure.equalize_hist(tmp)
                        #test_image = image.load_img(img, target_size = (64,64))
                        #test_image = image.img_to_array(test_image)
                        #test_image = np.expand_dims(test_image, axis = 0)
                        #result = loaded_model.predict(test_image)
                        #training_set.class_indices
                        #geoImage.processedData[GreeneryFilter.filterId] = mask
                        #geoImage.setProcessedData(PoleWiresFilter.filterId, '', result)
                        #feature['properties']['geoImages'][lineIndex][coordinateIndex] = geoImage.toJSON()
            elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
                for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                    geoImage = feature['properties']['geoImages'][coordinateIndex]
                    try:
                        geoImage = GeoImage.fromJSON(geoImage)
                    except JSONDecodeError:
                        print('Error while parsing panorama: ' + str(geoImage)[:100])
                    cls._setOutput(geoImage, feature['properties']['geoImages'], coordinateIndex)
                    # entry = geoImage.data
                    # tmp = Image.fromarray(entry)
                    # img = exposure.equalize_hist(tmp)
                    # test_image = image.load_img(img, target_size = (64,64))
                    # test_image = image.img_to_array(test_image)
                    # test_image = np.expand_dims(test_image, axis = 0)
                    # result = loaded_model.predict(test_image)
                    # training_set.class_indices
                    # #geoImage.processedData[GreeneryFilter.filterId] = mask
                    # geoImage.setProcessedData(PoleWiresFilter.filterId, '', result)
                    # feature['properties']['geoImages'][coordinateIndex] = geoImage.toJSON()
            elif feature['geometry']['type'] == 'Point':
                coordinateIndex = 0
                geoImage = feature['properties']['geoImages'][coordinateIndex]
                try:
                    geoImage = GeoImage.fromJSON(geoImage)
                except JSONDecodeError:
                    print('Error while parsing panorama: ' + str(geoImage)[:100])
                cls._setOutput(geoImage, feature['properties']['geoImages'], coordinateIndex)
                    # entry = geoImage.data
                    # tmp = Image.fromarray(entry)
                    # img = exposure.equalize_hist(tmp)
                    # test_image = image.load_img(img, target_size = (64,64))
                    # test_image = image.img_to_array(test_image)
                    # test_image = np.expand_dims(test_image, axis = 0)
                    # result = loaded_model.predict(test_image)
                    # training_set.class_indices
                #geoImage.processedData[GreeneryFilter.filterId] = mask
                # geoImage.setProcessedData(PoleWiresFilter.filterId, '', result)
                # feature['properties']['geoImages'][coordinateIndex] = geoImage.toJSON()
        return featureCollection
