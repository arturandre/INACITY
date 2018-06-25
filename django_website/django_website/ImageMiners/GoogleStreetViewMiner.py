from django_website.ImageMiners.ImageMiner import ImageMiner
import requests
import imageio
from io import BytesIO
import numpy as np
from django_website.Primitives.Primitives import GeoImage
import geojson
from geojson import Point, MultiPoint, LineString, MultiLineString, Feature, FeatureCollection
from typing import List
import json

class Size():
    def __init__(self, width, height):
        self.width = width
        self.height = height


class GoogleStreetViewMiner(ImageMiner):
    """Google Street View wrapper"""

    __all__ = ["imageMinerName", "imageMinerId", "getImageFromLocation"]

    _baseurl = "https://maps.googleapis.com/maps/api/streetview"
    _key = "AIzaSyD5HdIiGhBEap1V9hHPjhq87wB07Swg-Gc"
    _GSVNodeBaseURL = "http://localhost:3000/"
    _GSVNodeCollectFCPanoramasURL = "http://localhost:3000/collectfcpanoramas"
    
    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")
    

    imageMinerName = "Google Street View"
    imageMinerId = "gsminer"

    def getImageForFeatureCollection(featureCollection: FeatureCollection) -> FeatureCollection:
        """Receives a feature collection of point/line or their multi equivalents and returns a list of GeoImage's"""
        gsvpanoramas = requests.post(GoogleStreetViewMiner._GSVNodeCollectFCPanoramasURL, json=featureCollection)
        featureCollection = geojson.loads(gsvpanoramas.text)
        for feature in featureCollection['features']:
            if feature['geometry']['type'] == 'MultiPolygon':
                #Number of Polygons
                for polygonIndex, polygon in enumerate(feature['geometry']['coordinates']):
                    for lineIndex, lineString in enumerate(polygon):
                        for coordinateIndex in range(len(lineString)):
                            streetViewPanoramaData = feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex]
                            if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                                continue
                            feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex] =\
                                GoogleStreetViewMiner.\
                                    createGeoImageFromStreetViewPanoramaData\
                                        (streetViewPanoramaData).toJSON()
            elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
                for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                    for coordinateIndex in range(len(lineString)):
                        streetViewPanoramaData = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                        if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                            continue
                        feature['properties']['geoImages'][lineIndex][coordinateIndex] =\
                            GoogleStreetViewMiner.\
                                createGeoImageFromStreetViewPanoramaData\
                                    (streetViewPanoramaData).toJSON()
            elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
                for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                    streetViewPanoramaData = feature['properties']['geoImages'][coordinateIndex]
                    if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                        continue
                    feature['properties']['geoImages'][coordinateIndex] =\
                        GoogleStreetViewMiner.\
                            createGeoImageFromStreetViewPanoramaData\
                                (streetViewPanoramaData).toJSON()
            elif feature['geometry']['type'] == 'Point':
                coordinateIndex = 0
                streetViewPanoramaData = feature['properties']['geoImages'][coordinateIndex]
                if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                    continue
                feature['properties']['geoImages'][coordinateIndex] =\
                    GoogleStreetViewMiner.\
                        createGeoImageFromStreetViewPanoramaData\
                            (streetViewPanoramaData).toJSON()
            

        #    for coordinateData in feature:
        #        location = coordinateData['location']
        #        geoImage = GeoImage();
        #        geoImage.id = location['pano']
        #        geoImage.location = Point([location['lon'], location['lat']])
        #        geoImage.heading = coordinateData['tiles']['centerHeading']
        #        geoImage.pitch = coordinateData['tiles']['originPitch']
        #        geoImage.metadata = coordinateData
        #        imageURL = GoogleStreetViewMiner._imageURLBuilderForGeoImage(geoImage)
        #        geoImage.metadata['imageURL'] = imageURL
        #        #imageRawData = requests.get(imageURL).content
        #        #imageData = imageio.imread(BytesIO(imageRawData))
        #        #geoImage.setData(imageData)
        #        ret.append(geoImage)
        #return ret
        return featureCollection
    def createGeoImageFromStreetViewPanoramaData(streetViewPanoramaData):
        geoImage = GeoImage()
        geoImage.id = streetViewPanoramaData['location']['pano']
        geoImage.location = streetViewPanoramaData['location']
        geoImage.heading = streetViewPanoramaData['tiles']['centerHeading']
        geoImage.pitch = streetViewPanoramaData['tiles']['originPitch']
        geoImage.metadata = streetViewPanoramaData
        geoImage.metadata['imageURL'] = GoogleStreetViewMiner._imageURLBuilderForGeoImage(geoImage)
        return geoImage


    def getImageFromLocation(location, size: Size=None, heading=0, pitch=0, key=None):
        if key is None: key = GoogleStreetViewMiner._key
        if size is None: size = Size(640, 640)
        imageURL = GoogleStreetViewMiner._imageURLBuilderLocation(size, location, heading, pitch, key)
        data = requests.get(imageURL).content
        GeoImage = GeoImage(imageio.imread(BytesIO(data)))
        return GeoImage
        
    
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def _imageURLBuilderLocation(size: Size, location: Point, heading: float, pitch: float, key: str):
        return GoogleStreetViewMiner._baseurl + GoogleStreetViewMiner._queryStringBuilderLocation(size, location, heading, pitch, key)

    def _queryStringBuilderLocation(size: Size, location: Point, heading: float, pitch: float, key: str):
        return "?size=%dx%d&location=%f,%f&heading=%f&pitch=%f&key=%s"% (size.width, size.height, location['lat'], location['lon'], heading,pitch,key)
    
    def _imageURLBuilderForGeoImage(geoImage: GeoImage, size: Size=None, key: str=None):
        if size is None: size = Size(640, 640)
        if key is None: key = GoogleStreetViewMiner._key
        return GoogleStreetViewMiner._imageURLBuilder(
            size,
            geoImage.id,
            geoImage.heading,
            geoImage.pitch,
            GoogleStreetViewMiner._key)
 
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def _imageURLBuilder(size: Size, panoid: str, heading: float, pitch: float, key: str):
        return GoogleStreetViewMiner._baseurl + GoogleStreetViewMiner._queryStringBuilderPanorama(size, panoid, heading, pitch, key)

    def _queryStringBuilderPanorama(size: Size, panoid: str, heading: float, pitch: float, key: str):
        return "?size=%dx%d&pano=%s&heading=%f&pitch=%f&key=%s" % (size.width,size.height, panoid, heading,pitch,key)

