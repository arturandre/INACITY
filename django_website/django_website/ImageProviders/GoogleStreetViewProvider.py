from .ImageProvider import ImageProvider
import requests
import imageio
from io import BytesIO
import numpy as np
from django_website.Primitives.GeoImage import GeoImage
import geojson
from geojson import Point, MultiPoint, LineString, MultiLineString, Feature, FeatureCollection
from typing import List
import json

from GSVPanoramaManager.db import DBManager
from GSVPanoramaManager import settings

from django_website import settings_secret
from django_website.LogGenerator import write_to_log

import hashlib
import hmac
import base64
import urllib
#import urlparse

import os

class Size():
    def __init__(self, width, height):
        self.width = width
        self.height = height


class GoogleStreetViewProvider(ImageProvider):
    """Google Street View wrapper (DEPRECATED)
    GSV is now managed by javascript (home/GSVService.js)"""

    __all__ = ["imageProviderName", "imageProviderId", "getImageFromLocation"]

    _baseurl = "https://maps.googleapis.com/maps/api/streetview"
    _key = settings_secret.GSV_KEY
    #_key = "AIzaSyD5HdIiGhBEap1V9hHPjhq87wB07Swg-Gc"
    #_GSVNodeBaseURL = "http://localhost:3000/"
    #_GSVNodeCollectFCPanoramasURL = "http://localhost:3000/collectfcpanoramas"
    
    def __init__(self):
        raise Exception("This is a static class and should not be instantiated.")
    

    imageProviderName = "Google Street View"
    imageProviderId = "gsvProvider"

    @staticmethod
    def getImageForFeature(feature: Feature) -> Feature:
        """
        Receives a single Feature from a 
        Feature Collection of point/line or their
        multi equivalents and inserts a "geoimages"
        property with images for the coordinates of this
        Feature.

        Works in-place.

        The geoimages property will have the same structure 
        of the geometry property.

        The coordinates without a corresponding panorama will
        be represented by a string "NOT FOUND" in the geoimages
        correspondent position.
        """

        write_to_log(f'getImageForFeature')
        dbmanager = DBManager()

        def ffunction(feature, clonedTree):
            """
            ffunction - Feature's function
            Defines how each feature (e.g. street) must be
            processed.
            """
            feature['properties']['geoImages'] = clonedTree
            pass

        def cfunction(coordinates):
            """
            cfunction - Coordinates's function
            Defines how each coordinate must be processed.
            """
            #Try to retrieve or collect the panorama
            panorama = dbmanager.retrieve_nearest_panorama(coordinates)\
                or dbmanager.collect_panorama_by_location(coordinates)
            if panorama:
                #Get view and consequently the stored image or its url
                pano_id = panorama['pano']
                heading = panorama['centerHeading']
                pitch = panorama['originPitch']
                
                # Optional: Just used to keep track of which views
                # were already collected.

                view = dbmanager.retrieve_panorama_view(
                    pano_id,
                    target_heading=heading,
                    heading_tolerance=10,
                    target_pitch=pitch,
                    pitch_tolerance=1
                    ) or dbmanager.create_update_view(
                        pano_id,
                        heading,
                        pitch
                        )
                
                #img_filename = dbmanager.image_filename_from_panorama_parameters(
                #    pano_id,
                #    heading,
                #    pitch
                #)
                #img_path = os.path.join(
                #    settings.PICTURES_FOLDER,
                #    img_filename
                #)
                #if os.path.exists(img_path):

                local_img = dbmanager._retrieve_local_image(
                    pano_id,
                    view
                    )
                if not local_img:
                    dbmanager._store_image_local(
                        pano_id,
                        view
                        )
                    local_img = dbmanager._retrieve_local_image(
                        pano_id,
                        view
                        )
                    pass
                return GoogleStreetViewProvider.createGeoImage(
                    pano_id,
                    panorama['location'],
                    view,
                    local_img
                ).toJSON()
            else:
                return "NOT FOUND"
        
        clonedTree = ImageProvider.traverseFeature(feature, cfunction)
        ffunction(feature, clonedTree)
        return True

    @staticmethod
    def getImageForFeatureCollection(featureCollection: FeatureCollection) -> FeatureCollection:
        """
        Receives a feature collection of point/line or their
        multi equivalents and returns a list of GeoImage's
        """
        write_to_log(f'getImageForFeatureCollection')

        dbmanager = DBManager()

        def ffunction(feature, clonedTree):
            """
            ffunction - Feature's function
            Defines how each feature (e.g. street) must be
            processed.
            """
            feature['properties']['geoImages'] = clonedTree
            pass
        
        def cfunction(coordinates):
            """
            cfunction - Coordinates's function
            Defines how each coordinate must be processed.
            """
            #Try to retrieve or collect the panorama
            panorama = dbmanager.retrieve_nearest_panorama(coordinates)\
                or dbmanager.collect_panorama_by_location(coordinates)
            if panorama:
                #Get view and consequently the stored image or its url
                pano_id = panorama['pano']
                heading = panorama['centerHeading']
                pitch = panorama['originPitch']
                
                # Optional: Just used to keep track of which views
                # were already collected.

                view = dbmanager.retrieve_panorama_view(
                    pano_id,
                    target_heading=heading,
                    heading_tolerance=10,
                    target_pitch=pitch,
                    pitch_tolerance=1
                    ) or dbmanager.create_update_view(
                        pano_id,
                        heading,
                        pitch
                        )
                
                #img_filename = dbmanager.image_filename_from_panorama_parameters(
                #    pano_id,
                #    heading,
                #    pitch
                #)
                #img_path = os.path.join(
                #    settings.PICTURES_FOLDER,
                #    img_filename
                #)
                #if os.path.exists(img_path):

                local_img = dbmanager._retrieve_local_image(
                    pano_id,
                    view
                    )
                if not local_img:
                    dbmanager._store_image_local(
                        pano_id,
                        view
                        )
                    local_img = dbmanager._retrieve_local_image(
                        pano_id,
                        view
                        )
                    pass
                return GoogleStreetViewProvider.createGeoImage(
                    pano_id,
                    panorama['location'],
                    view,
                    local_img
                ).toJSON()
            else:
                return "NOT FOUND"                

        ImageProvider.traverseFeatureCollection(featureCollection, ffunction, cfunction)
        return True

    @staticmethod
    def createGeoImage(pano_id, location, view, data):
        write_to_log(f'createGeoImageFromStreetViewPanoramaData')
        geoImage = GeoImage()
        geoImage.id = pano_id
        geoImage.location = {"coordinates": location}
        geoImage.heading = view['heading']
        geoImage.pitch = view['pitch']
        #geoImage.data = GoogleStreetViewProvider._imageURLBuilderForGeoImage(geoImage)
        geoImage.dataType = "data:image/jpeg;base64"
        geoImage.data = f'data:image/jpeg;base64,{data}'
        #geoImage.dataType = "URL"
        geoImage.metadata['imageURL'] = GoogleStreetViewProvider._imageURLBuilderForGeoImage(geoImage)
        return geoImage

        
        
        #gsvpanoramas = requests.post(GoogleStreetViewProvider._GSVNodeCollectFCPanoramasURL, json=featureCollection)
        #if not gsvpanoramas.ok:
            #gsvpanoramas.status_code #413
            #gsvpanoramas.reason #'Payload Too Large'
        #    return gsvpanoramas
        
        # featureCollection = geojson.loads(gsvpanoramas.text)
        # #featureCollection = None
        # for feature in featureCollection['features']:
        #     if feature['geometry']['type'] == 'MultiPolygon':
        #         #Number of Polygons
        #         for polygonIndex, polygon in enumerate(feature['geometry']['coordinates']):
        #             for lineIndex, lineString in enumerate(polygon):
        #                 for coordinateIndex in range(len(lineString)):
        #                     streetViewPanoramaData = feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex]
        #                     #The lack of a panorama should be propagated in order to keep the
        #                     #geoImages property structurely equal to the geography property
        #                     if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
        #                         feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex] =\
        #                             streetViewPanoramaData
        #                     else:
        #                         feature['properties']['geoImages'][polygonIndex][lineIndex][coordinateIndex] =\
        #                             GoogleStreetViewProvider.\
        #                                 createGeoImageFromStreetViewPanoramaData\
        #                                     (streetViewPanoramaData).toJSON()
        #     elif (feature['geometry']['type'] == 'MultiLineString') or (feature['geometry']['type'] == 'Polygon'):
        #         for lineIndex, lineString in enumerate(feature['geometry']['coordinates']):
        #             for coordinateIndex in range(len(lineString)):
        #                 streetViewPanoramaData = feature['properties']['geoImages'][lineIndex][coordinateIndex]
        #                 #The lack of a panorama should be propagated in order to keep the
        #                 #geoImages property structurely equal to the geography property
        #                 if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
        #                     feature['properties']['geoImages'][lineIndex][coordinateIndex] =\
        #                         streetViewPanoramaData
        #                 else:
        #                     feature['properties']['geoImages'][lineIndex][coordinateIndex] =\
        #                         GoogleStreetViewProvider.\
        #                             createGeoImageFromStreetViewPanoramaData\
        #                                 (streetViewPanoramaData).toJSON()
        #     elif (feature['geometry']['type'] == 'LineString') or (feature['geometry']['type'] == 'MultiPoint'):
        #         for coordinateIndex in range(len(feature['geometry']['coordinates'])):
        #             streetViewPanoramaData = feature['properties']['geoImages'][coordinateIndex]
        #             #The lack of a panorama should be propagated in order to keep the
        #             #geoImages property structurely equal to the geography property
        #             if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
        #                 feature['properties']['geoImages'][coordinateIndex] =\
        #                     streetViewPanoramaData
        #             else:
        #                 feature['properties']['geoImages'][coordinateIndex] =\
        #                     GoogleStreetViewProvider.\
        #                         createGeoImageFromStreetViewPanoramaData\
        #                             (streetViewPanoramaData).toJSON()
        #     elif feature['geometry']['type'] == 'Point':
        #         coordinateIndex = 0
        #         streetViewPanoramaData = feature['properties']['geoImages'][coordinateIndex]
        #         #The lack of a panorama should be propagated in order to keep the
        #         #geoImages property structurely equal to the geography property
        #         if isinstance(streetViewPanoramaData, str): #Error or ZERO_RESULTS
        #             feature['properties']['geoImages'][coordinateIndex] =\
        #                 streetViewPanoramaData
        #         else:
        #             feature['properties']['geoImages'][coordinateIndex] =\
        #                 GoogleStreetViewProvider.\
        #                     createGeoImageFromStreetViewPanoramaData\
        #                         (streetViewPanoramaData).toJSON()
      
        # return featureCollection

    @staticmethod
    def createGeoImageFromStreetViewPanoramaData(streetViewPanoramaData):
        """DEPRECATED"""
        write_to_log(f'createGeoImageFromStreetViewPanoramaData')
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

    #Unused
    #def getImageFromLocation(location, size: Size=None, heading=0, pitch=0, key=None):
    #    if key is None: key = GoogleStreetViewProvider._key
    #    if size is None: size = Size(640, 640)
    #    imageURL = GoogleStreetViewProvider._imageURLBuilderLocation(size, location, heading, pitch, key)
    #    data = requests.get(imageURL).content
    #    GeoImage = GeoImage(imageio.imread(BytesIO(data)))
    #    return GeoImage

    #ref: https://developers.google.com/maps/documentation/streetview/get-api-key#sample-code-for-url-signing
    @staticmethod
    def _sign_url(input_url=None):
        """ Sign a request URL with a URL signing secret.

            Usage:
            from urlsigner import sign_url

            signed_url = sign_url(input_url=my_url, secret=SECRET)

            Args:
            input_url - The URL to sign
            secret    - Your URL signing secret

            Returns:
            The signed request URL
        """
        write_to_log(f'_sign_url')
        secret = settings_secret.GSV_SIGNING_SECRET
        write_to_log(f'secret: {secret}')

        if not input_url or not secret:
            raise Exception("input_url and secret are required")

        #url = urlparse.urlparse(input_url)
        url = urllib.parse.urlparse(input_url)

        # We only need to sign the path+query part of the string
        url_to_sign = url.path + "?" + url.query

        # Decode the private key into its binary format
        # We need to decode the URL-encoded private key
        decoded_key = base64.urlsafe_b64decode(secret)

        # Create a signature using the private key and the URL-encoded
        # string using HMAC SHA1. This signature will be binary.
        signature = hmac.new(decoded_key, url_to_sign.encode('utf8'), hashlib.sha1)

        # Encode the binary signature into base64 for use within a URL
        encoded_signature = base64.urlsafe_b64encode(signature.digest())

        original_url = url.scheme + "://" + url.netloc + url.path + "?" + url.query

        # Return signed URL
        return original_url + "&signature=" + encoded_signature.decode('utf8')
        
    
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    @staticmethod
    def _imageURLBuilderLocation(size: Size, location: Point, heading: float, pitch: float, key: str):
        write_to_log(f'_imageURLBuilderLocation')
        unsigned_url = GoogleStreetViewProvider._baseurl + GoogleStreetViewProvider._queryStringBuilderLocation(size, location, heading, pitch, key)
        signed_url = GoogleStreetViewProvider._sign_url(unsigned_url)
        write_to_log(f'signed_url: {signed_url}')
        return signed_url

    @staticmethod
    def _queryStringBuilderLocation(size: Size, location: Point, heading: float, pitch: float, key: str):
        write_to_log(f'_queryStringBuilderLocation')
        return "?size=%dx%d&location=%f,%f&heading=%f&pitch=%f&key=%s"% (size.width, size.height, location['lat'], location['lon'], heading,pitch,key)
    
    @staticmethod
    def _imageURLBuilderForGeoImage(geoImage: GeoImage, size: Size=None, key: str=None):
        write_to_log(f'_imageURLBuilderForGeoImage')
        if size is None: size = Size(640, 640)
        if key is None: key = GoogleStreetViewProvider._key
        return GoogleStreetViewProvider._imageURLBuilder(
            size,
            geoImage.id,
            geoImage.heading,
            geoImage.pitch,
            GoogleStreetViewProvider._key)
 
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    @staticmethod
    def _imageURLBuilder(size: Size, panoid: str, heading: float, pitch: float, key: str):
        write_to_log(f'_imageURLBuilder')
        unsigned_url = GoogleStreetViewProvider._baseurl + GoogleStreetViewProvider._queryStringBuilderPanorama(size, panoid, heading, pitch, key)
        signed_url = GoogleStreetViewProvider._sign_url(unsigned_url)
        #print(f'signed_url: {signed_url}')
        return signed_url

    @staticmethod
    def _queryStringBuilderPanorama(size: Size, panoid: str, heading: float, pitch: float, key: str):
        write_to_log(f'_queryStringBuilderPanorama')
        return "?size=%dx%d&pano=%s&heading=%f&pitch=%f&key=%s" % (size.width,size.height, panoid, heading,pitch,key)

