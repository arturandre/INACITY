class GoogleStreetViewMiner(ImageMiner):
    """Google Street View wrapper"""

    __all__ = ["minerName", "minerId", "getImageFromLocation"]

    _baseurl = "https://maps.googleapis.com/maps/api/streetview"

    

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

    def queryStringBuilder():
        return "?size=%s&location=%s&heading=%f&pitch=%f&key=%s"% (size,location, heading,pitch,key)
     
