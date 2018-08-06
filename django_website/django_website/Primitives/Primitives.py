import imageio
import numpy as np
from typing import List
import json
import geojson
from PIL import Image
from io import BytesIO
import base64
from skimage import img_as_float, img_as_ubyte

class SimpleDTO(object):
    def __init__(self):
        pass

    def toJSON(self, compact=True):
        if compact:
            return json.dumps(self, default=lambda o: o.__dict__, 
                sort_keys=True, separators=(',', ':'))
        else:
            return json.dumps(self, default=lambda o: o.__dict__, 
                sort_keys=True, indent=4)

class GeoImage(SimpleDTO):
    """Object responsible for keeping image and panorama's data"""
    def __init__(self):
        self.id = None
        self.data = None
        self.dataType = None
        self.location = geojson.Point()
        self.heading = 0
        self.pitch = 0
        self.metadata = {} #Json Structured list

    @classmethod
    def fromJSON(cls, jsonData: dict):
        geoImage = cls()
        geoImage.id = jsonData['id']
        geoImage.data = jsonData['data']
        geoImage.dataType = jsonData['dataType']
        geoImage.location = jsonData['location']
        geoImage.heading = jsonData['heading']
        geoImage.pitch = jsonData['pitch']
        geoImage.metadata = jsonData['metadata']
        if geoImage.dataType == 'URL':
            geoImage.setDataFromImage(imageio.imread(geoImage.data))
        return geoImage

    def setDataFromImage(self, data: imageio.core.util.Image):
        self.data = data
        self.dataType = 'ndarray'
        if data.dtype == 'uint8':
            self.data = img_as_float(self.data)
        self.size = {'width': 0, 'height': 0, 'channels': 0}
        #self.size['channels'] = data.ndim
        #self.size['width'], self.size['height'], *_ = data.shape
        self.size['width'], self.size['height'], self.size['channels'] = data.shape

    def setDataFromBase64(self, data: str):
        image = np.array(Image.open(BytesIO(base64.b64decode(data))))
        self.data = data
        self.dataType = 'ndarray'
        if data.dtype == 'uint8':
            self.data = img_as_float(self.data)
        self.size = {'width': 0, 'height': 0, 'channels': 0}
        self.size['width'], self.size['height'], self.size['channels'] = data.shape

    def setDataToBase64(self):
        self.data = Image.fromarray(img_as_ubyte(self.data))
        buff = BytesIO()
        self.data.save(buff, format="JPEG")
        base64_image_string  = base64.b64encode(buff.getvalue()).decode("utf-8")
        self.data = base64_image_string
        self.dataType = 'data:image/jpeg;base64'

    def getPNG(self):
        outdata = self.data.copy();
        if outdata.dtype != 'uint8':
            outdata = np.uint8(outdata*255)
        return imageio.imwrite(imageio.RETURN_BYTES, outdata, format='PNG-PIL');
        