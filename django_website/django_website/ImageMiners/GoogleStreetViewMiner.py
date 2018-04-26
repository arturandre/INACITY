from django_website.ImageMiners.ImageMiner import ImageMiner
import requests
import imageio
from io import BytesIO
import numpy as np
from django_website.Primitives.Primitives import ImageDTO

class GoogleStreetViewMiner(ImageMiner):
    """Google Street View wrapper"""

    __all__ = ["imageMinerName", "imageMinerId", "getImageFromLocation"]

    __baseurl = "https://maps.googleapis.com/maps/api/streetview"
    __key = "AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m - xHYac"
    

    

    imageMinerName = "Google Street View"
    imageMinerId = "gsminer"

    def getImageFromLocation(location, size={'width':640, 'height':640}, heading=0, pitch=0, key=None):
        if key is None:
            key = GoogleStreetViewMiner._GoogleStreetViewMiner__key
        imageURL = GoogleStreetViewMiner._GoogleStreetViewMiner__imageURLBuilder(size, location, heading, pitch, key)
        data = requests.get(imageURL).content
        imageDTO = ImageDTO(imageio.imread(BytesIO(data)))
        return imageDTO
        
    
    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def __imageURLBuilder(size, location, heading, pitch, key):
        return GoogleStreetViewMiner._GoogleStreetViewMiner__baseurl + GoogleStreetViewMiner._GoogleStreetViewMiner__queryStringBuilder(size, location, heading, pitch, key)

    def __queryStringBuilder(size, location, heading, pitch, key):
        return "?size=%dx%d&location=%f,%f&heading=%f&pitch=%f&key=%s"% (size['width'],size['height'],location['lat'], location['lon'], heading,pitch,key)
     
