from django_website.ImageMiners.ImageMiner import ImageMiner
import urllib.request

class GoogleStreetViewMiner(ImageMiner):
    """Google Street View wrapper"""

    __all__ = ["minerName", "minerId", "getImageFromLocation"]

    __baseurl = "https://maps.googleapis.com/maps/api/streetview"
    __key = "AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m - xHYac"
    

    def __init__(self):
        pass

    @property
    def minerName(self):
        return "Google Street View"
        pass

    @property
    def minerId(self):
        return "gsminer"

    def getImageFromLocation(location):
        pass
    
    def __testURL():
        size = {"width": 640, "height": 640}
        location = {"lat": -23.560271, "lon": -46.731295}
        heading = 180
        pitch=-0.76
        return GoogleStreetViewMiner._GoogleStreetViewMiner__imageURLBuilder(size, location, heading, pitch, GoogleStreetViewMiner._GoogleStreetViewMiner__key)

    def __testGetImage():
        size = {"width": 640, "height": 640}
        location = {"lat": -23.560271, "lon": -46.731295}
        heading = 180
        pitch=-0.76
        imageURL = GoogleStreetViewMiner._GoogleStreetViewMiner__imageURLBuilder(size, location, heading, pitch, GoogleStreetViewMiner._GoogleStreetViewMiner__key)
        contents = urllib.request.urlopen(imageURL).read()
        return contents

    #https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def __imageURLBuilder(size, location, heading, pitch, key):
        return GoogleStreetViewMiner._GoogleStreetViewMiner__baseurl + GoogleStreetViewMiner._GoogleStreetViewMiner__queryStringBuilder(size, location, heading, pitch, key)

    def __queryStringBuilder(size, location, heading, pitch, key):
        return "?size=%dx%d&location=%f,%f&heading=%f&pitch=%f&key=%s"% (size['width'],size['height'],location['lat'], location['lon'], heading,pitch,key)
     
