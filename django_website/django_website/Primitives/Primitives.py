import imageio
import numpy as np
from typing import List
import json
import geojson

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
        self.location = geojson.Point()
        self.heading = 0
        self.pitch = 0
        self.metadata = {} #Json Structured list
    def setData(self, data: imageio.core.util.Image):
        self.data = data
        if data.dtype == 'uint8':
            self.data = np.float32(self.data)/255
        self.size = {'width': 0, 'height': 0, 'channels': 0}
        self.size['channels'] = data.ndim
        self.size['width'], self.size['height'], *_ = data.shape

    def getPNG(self):
        outdata = self.data.copy();
        if outdata.dtype != 'uint8':
            outdata = np.uint8(outdata*255)
        return imageio.imwrite(imageio.RETURN_BYTES, outdata, format='PNG-PIL');
        