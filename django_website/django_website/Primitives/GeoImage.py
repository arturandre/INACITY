import imageio
import numpy as np
from typing import List
import json
from json import JSONEncoder
import geojson
from PIL import Image
from io import BytesIO
import base64
from skimage import img_as_float, img_as_ubyte

from PIL import Image
from io import BytesIO
import base64
from skimage import img_as_float, img_as_ubyte

class SimpleDTO(object):
    """Base class used to convert objects
    to JSON notation facilitating the
    communication between front
    and back ends.

    """
    def __init__(self):
        pass

    def toJSON(self, compact=True):
        """
        Rewrites the instance as a JSON object

        Parameters
        ----------
        compact=True : boolean
            If true line-breaks and whitespaces
            will not be included.
        

        Returns
        -------
            str representation of the object

        """
        ret = None
        if compact:
            ret = json.dumps(self, default=lambda o: o.__dict__, 
                sort_keys=True, separators=(',', ':'))
        else:
            ret = json.dumps(self, default=lambda o: o.__dict__, 
                sort_keys=True, indent=4)
        print(ret)
        return ret

class CustomJSONEncoder(JSONEncoder):
    """
    Convenience class used to return JSON
    responses in the views.

    """
    def default(self, o):
        return o.__dict__

class ProcessedImageData():
    """
    Represents the result object derived from 
    some subclass of :py:class:`django_website.MapMiners.MapMiner.MapMiner`.

    fields:
        - id=None : str
            Representation of the geoImage used
            to referentiate it at the backend.
        - imageData=None : str
            A base64 encoded sting or an url
            to the actual image. Depends on
            the property imageDataType.
        - imageDataType=None : str
            data:image/jpeg;base64 if the imageData is base64 encoded
            URL if the imageData is a url to the actual image.
        - filterId=None: str
            The identification (filterId property) of the
            :py:class:`django_website.ImageFilters.ImageFilter.ImageFilter`
            subclass used to generate this ProcessedImageData.
        - density=-1 : float
            This property can be used as a quantitative metric
            about the processed image (e.g. ammount of greenery
            in the processed image).
        - isPresent=None : boolean
            This property can be used as a flag indicating
            the presence of some feature found in the 
            processed image.

    """
    def __init__(self):
        self.id = None
        self.imageData = None
        self.imageDataType = None
        self.filterId = None
        self.density = -1
        self.isPresent = None

class GeoImage():
    """
    Object responsible for keeping image and panorama's data

    fields: 
        - id : str
            Used to syncronize calls to the image filtering endpoint (see :class:`ImageFilter`).
        - data : str
            Used to hold either the image from this location, (encoded as a base64 string) or an url to it.
        - dataType : str
            Used to distinguish when data is a base64 string encoding an image or an url to it.
            dataType will be 'URL' in the latter case and 'data:image/jpeg;base64' otherwise.
        - location : <geojson.Point>
            Represents the geographical location of this object.
            A <geojson.Point> is represented by its 'coordinates' property which are in turn
            a tuple with exactly 2 or 3 values.
        - heading : float
            Represents the horizontal angle of the image.
            That is the azimuth, of some spherical coordinate system, of the camera
            in the moment that the picture was taken.
        - pitch : float
            Represents the vertical angle of the image,
            that is the altitude of a spherical coordinate system, of the camera
            in the moment that the picture was taken.
        - metadata : dict
            Represents data not directly related to the GeoImage but usefull
            for relating it to other GeoImages. For example, the metadata
            may contain information about other GeoImages in the same
            location, or perhaps the timestamp of when the picture
            was taken.
        - processedDataList : dict[str, :class:`ProcessedImageData`]
            Contains the list of ProcessedImageData objects related
            to this GeoImage. For example, after being processed
            by the :class:`GreeneryFilter` class a GeoImage will
            contain as one of its processedDataList members the
            'greenery' key to a ProcessedImageData containing
            the results of the greenery filter applied over
            this GeoImage.

    """
    def __init__(self):
        self.id = None
        self.data = None
        self.dataType = None
        self.location = geojson.Point()
        self.heading = 0
        self.pitch = 0
        self.metadata = {} #Json Structured dict
        self.processedDataList = {} #Dictionary containing ProcessedData objects as values and filterId's as keys

    @classmethod
    def fromJSON(cls, jsonData: dict):
        """
        Helper method used to instantiate a GeoImage
        from its JSON representation (encoded as a dict).

        Parameters
        ----------

        jsonData: dict
            The dict representing the GeoImage to be
            instantiated.

        Returns
        -------
        A new instance of :class:`GeoImage`



        """
        geoImage = cls()
        geoImage.id = jsonData.get('id')
        geoImage.data = jsonData.get('data')
        geoImage.dataType = jsonData.get('dataType')
        geoImage.location = jsonData.get('location', geojson.Point())
        geoImage.heading = jsonData.get('heading', 0)
        geoImage.pitch = jsonData.get('pitch', 0)
        geoImage.metadata = jsonData.get('metadata', {}) or {}
        geoImage.processedDataList = jsonData.get('processedDataList', {}) or {}
        #if geoImage.dataType == 'URL':
        #    geoImage.setDataFromImage(imageio.imread(geoImage.data))
        return geoImage

    #def setDataFromImage(self, data: imageio.core.util.Image):
    #    self.data = data
    #    self.dataType = 'ndarray'
    #    if data.dtype == 'uint8':
    #        self.data = img_as_float(self.data)
    #    self.size = {'width': 0, 'height': 0, 'channels': 0}
    #    #self.size['channels'] = data.ndim
    #    #self.size['width'], self.size['height'], *_ = data.shape
    #    self.size['width'], self.size['height'], self.size['channels'] = data.shape

    #def setDataFromBase64(self, data: str):
    #    image = np.array(Image.open(BytesIO(base64.b64decode(data))))
    #    self.data = data
    #    self.dataType = 'ndarray'
    #    if data.dtype == 'uint8':
    #        self.data = img_as_float(self.data)
    #    self.size = {'width': 0, 'height': 0, 'channels': 0}
    #    self.size['width'], self.size['height'], self.size['channels'] = data.shape

    #def setDataToBase64(self):
    #    """Converts the 'data' property from 'ndarray' to a jpeg image encoded in a base64 string"""
    #    if self.dataType == 'ndarray':
    #        self.data = Image.fromarray(img_as_ubyte(self.data))
    #    elif self.dataType == 'data:image/jpeg;base64':
    #        return
    #    #buff = BytesIO()
    ##    #self.data.save(buff, format="JPEG")
     #   #base64_image_string  = base64.b64encode(buff.getvalue()).decode("utf-8")
     #   #self.data = base64_image_string
     #   self.data = GeoImage.imageToBase64JPEG(self.data)
     #   self.dataType = 'data:image/jpeg;base64'
    
    @staticmethod
    def imageToBase64JPEG(inputImage: Image):
        """
        Used to encode a PIL Image into a base64 string.

        Parameters
        ----------
        inputImage: PIL.Image
            The image to be encoded

        Returns
        -------
        A base64 encoded string representing the input image.

        """
        buff = BytesIO()
        inputImage.save(buff, format="JPEG")
        return base64.b64encode(buff.getvalue()).decode("utf-8")

    @staticmethod
    def Base64ToImage(base64str):
        """
        Used to encode a base64 string into a PIL Image.

        Parameters
        ----------
        base64str: str
            The base64 string encoded image to be decoded

        Returns
        -------
        An base64 decoded image.

        """
        image_binary = base64.decodestring(base64str.encode('ascii'))
        return image_binary
    
    def setProcessedData(self, filterId: str, type: str, imageData=None, density=-1, isPresent=None):
        """
        Sets or updates a ProcessedData object (identified by its filterId) from the ProcessedDataDict
        
        Parameters
        ----------
        filterId : str
            Identifies the ProcessedData object with the id
            of the :class:`ImageFilter` subclass used.
        type:  str
            Defines the image format ('ndarray' or None)
        imageData=None: Any
            Image's pixel data, defaults to None. But can be
            a Numpy.ndarray or a base64 string
        density=-1: float
            Defines how much of a feature is present in an image (eg. greenery), defaults to -1
        isPresent=None: boolean
            Defines if a feature exists in the image (eg. Poles), defaults to None
            
        """

        pImageData = ProcessedImageData()
        if type == 'ndarray':
            imageData = Image.fromarray(img_as_ubyte(imageData))
            imageData = GeoImage.imageToBase64JPEG(imageData)
            pImageData.imageData = f'data:image/jpeg;base64,{imageData}'
        pImageData.filterId = filterId
        pImageData.density = density
        pImageData.isPresent = isPresent

        self.processedDataList[filterId] = pImageData
        

    # def getPNG(self):
    #     """Converts the image to a PNG file"""
    #     outdata = self.data.copy()
    #     if outdata.dtype != 'uint8': 
    #         outdata = np.uint8(outdata*255)
    #     return imageio.imwrite(imageio.RETURN_BYTES, outdata, format='PNG-PIL')
        


