import imageio
import numpy as np
from typing import List
import json

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


class PointDTO(SimpleDTO):
    """Geocoordinate used for communication"""
    def __init__(self, lat, lon):
        self.lat = lat
        self.lon = lon

class StreetDTO(SimpleDTO):
    """Street representation used for communication"""
    def __init__(self, name: str, segments: List[PointDTO]):
        self.name = name
        self.segments = segments

class AmenityDTO:
    pass

class ImageDTO:
    def __init__(self, data: imageio.core.util.Image):
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
        