from django_website.ImageMiners.ImageMiner import ImageMiner
import requests
import imageio
from io import BytesIO
import numpy as np
from django_website.Primitives.Primitives import GeoImage

from geojson import Point, MultiPoint, LineString, MultiLineString, Feature, FeatureCollection
from typing import List
import json


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
    def getImageForFeatureCollection(featureCollection: FeatureCollection) -> List[GeoImage]:
        """Receives a feature collection of point/line or their multi equivalents and returns a list of GeoImage's"""
        gsvpanoramas = requests.post(GoogleStreetViewMiner._GSVNodeCollectFCPanoramasURL, json=featureCollection)
        pdicts = json.loads(gsvpanoramas.text)
        ret = []
        for feature in pdicts:
            for coordinateData in feature:
                geoImage = GeoImage();
                geoImage.location = Point([coordinateData['lon'], coordinateData['lat']])
                geoImage.metadata = coordinateData
                ret.append(geoImage);
        return ret

    def getGeoImagesFromLocations(locations: FeatureCollection):
        """Collect images based on a collection of GeoJson features"""
        for feature in regions['features']:
            geom = feature['geometry']
            if (geom is Polygon) or (geom is MultiPolygon)\
                or (geom is LineString) or (geom is MultiLineString):
                for coordinate in geom.get('coordinates'):
                    #TODO: GET A PANORAMA
                    #panorama = 
                    pass
                pass
            
        ret = [GeoImage()]
        return ret

    def getImageFromLocation(location, size={'width':640, 'height':640}, heading=0, pitch=0, key=None):
        if key is None:
            key = GoogleStreetViewMiner._key
        imageURL = GoogleStreetViewMiner._imageURLBuilder(size, location, heading, pitch, key)
        data = requests.get(imageURL).content
        GeoImage = GeoImage(imageio.imread(BytesIO(data)))
        return GeoImage
        
    
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def _imageURLBuilder(size, location, heading, pitch, key):
        return GoogleStreetViewMiner._baseurl + GoogleStreetViewMiner._queryStringBuilder(size, location, heading, pitch, key)

    def _queryStringBuilder(size, location, heading, pitch, key):
        return "?size=%dx%d&location=%f,%f&heading=%f&pitch=%f&key=%s"% (size['width'],size['height'],location['lat'], location['lon'], heading,pitch,key)
     
