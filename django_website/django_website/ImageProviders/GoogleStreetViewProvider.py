from django_website.ImageProviders.ImageProvider import ImageProvider
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


class GoogleStreetViewProvider(ImageProvider):
    """Google Street View wrapper"""

    __all__ = ["imageProviderName", "imageProviderId", "getImageFromLocation"]

    _baseurl = "https://maps.googleapis.com/maps/api/streetview"
    _key = "AIzaSyD5HdIiGhBEap1V9hHPjhq87wB07Swg-Gc"
    _GSVNodeBaseURL = "http://localhost:3000/"
    _GSVNodeCollectFCPanoramasURL = "http://localhost:3000/collectfcpanoramas"
    
    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")
    

    imageProviderName = "Google Street View"
    imageProviderId = "gsvProvider"

    def getImageForFeatureCollection(featureCollection: FeatureCollection) -> FeatureCollection:
        """Receives a feature collection of point/line or their multi equivalents and returns a list of GeoImage's"""
        gsvpanoramas = requests.post(GoogleStreetViewProvider._GSVNodeCollectFCPanoramasURL, json=featureCollection)
        if not gsvpanoramas.ok:
            #gsvpanoramas.status_code #413
            #gsvpanoramas.reason #'Payload Too Large'
            return gsvpanoramas
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
                                GoogleStreetViewProvider.\
                                    createGeoImageFromStreetViewPanoramaData\
                                        (streetViewPanoramaData).toJSON()
            elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
                for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
                    for coordinateIndex in range(len(lineString)):
                        streetViewPanoramaData = feature['properties']['geoImages'][lineIndex][coordinateIndex]
                        if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                            continue
                        feature['properties']['geoImages'][lineIndex][coordinateIndex] =\
                            GoogleStreetViewProvider.\
                                createGeoImageFromStreetViewPanoramaData\
                                    (streetViewPanoramaData).toJSON()
            elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
                for coordinateIndex in range(len(feature['geometry']['coordinates'])):
                    streetViewPanoramaData = feature['properties']['geoImages'][coordinateIndex]
                    if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                        continue
                    feature['properties']['geoImages'][coordinateIndex] =\
                        GoogleStreetViewProvider.\
                            createGeoImageFromStreetViewPanoramaData\
                                (streetViewPanoramaData).toJSON()
            elif feature['geometry']['type'] == 'Point':
                coordinateIndex = 0
                streetViewPanoramaData = feature['properties']['geoImages'][coordinateIndex]
                if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
                    continue
                feature['properties']['geoImages'][coordinateIndex] =\
                    GoogleStreetViewProvider.\
                        createGeoImageFromStreetViewPanoramaData\
                            (streetViewPanoramaData).toJSON()
      
        return featureCollection
    def createGeoImageFromStreetViewPanoramaData(streetViewPanoramaData):
        geoImage = GeoImage()
        geoImage.id = streetViewPanoramaData['location']['pano']
        geoImage.location = streetViewPanoramaData['location']
        geoImage.heading = streetViewPanoramaData['tiles']['centerHeading']
        geoImage.pitch = streetViewPanoramaData['tiles']['originPitch']
        geoImage.metadata = streetViewPanoramaData
        geoImage.data = GoogleStreetViewProvider._imageURLBuilderForGeoImage(geoImage)
        geoImage.dataType = "URL"
        geoImage.metadata['imageURL'] = GoogleStreetViewProvider._imageURLBuilderForGeoImage(geoImage)
        return geoImage


    def getImageFromLocation(location, size: Size=None, heading=0, pitch=0, key=None):
        if key is None: key = GoogleStreetViewProvider._key
        if size is None: size = Size(640, 640)
        imageURL = GoogleStreetViewProvider._imageURLBuilderLocation(size, location, heading, pitch, key)
        data = requests.get(imageURL).content
        GeoImage = GeoImage(imageio.imread(BytesIO(data)))
        return GeoImage
        
    
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def _imageURLBuilderLocation(size: Size, location: Point, heading: float, pitch: float, key: str):
        return GoogleStreetViewProvider._baseurl + GoogleStreetViewProvider._queryStringBuilderLocation(size, location, heading, pitch, key)

    def _queryStringBuilderLocation(size: Size, location: Point, heading: float, pitch: float, key: str):
        return "?size=%dx%d&location=%f,%f&heading=%f&pitch=%f&key=%s"% (size.width, size.height, location['lat'], location['lon'], heading,pitch,key)
    
    def _imageURLBuilderForGeoImage(geoImage: GeoImage, size: Size=None, key: str=None):
        if size is None: size = Size(640, 640)
        if key is None: key = GoogleStreetViewProvider._key
        return GoogleStreetViewProvider._imageURLBuilder(
            size,
            geoImage.id,
            geoImage.heading,
            geoImage.pitch,
            GoogleStreetViewProvider._key)
 
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def _imageURLBuilder(size: Size, panoid: str, heading: float, pitch: float, key: str):
        return GoogleStreetViewProvider._baseurl + GoogleStreetViewProvider._queryStringBuilderPanorama(size, panoid, heading, pitch, key)

    def _queryStringBuilderPanorama(size: Size, panoid: str, heading: float, pitch: float, key: str):
        return "?size=%dx%d&pano=%s&heading=%f&pitch=%f&key=%s" % (size.width,size.height, panoid, heading,pitch,key)

