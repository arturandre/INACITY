import requests
import sys
from io import BytesIO
import imageio
import numpy as np
from django_website.ImageMiners.GoogleStreetViewMiner import GoogleStreetViewMiner
from django_website.Managers.ImageMinerManager import ImageMinerManager

class GSVTesting(object):
    """Automated testing functions related to Google Street View image platform"""

    def testAll(self):
        try:

            print("gsvtest: %s" % "SUCCESS" if self._gsvtest() else "FAIL")
            print("gsvimagetest: %s" % "SUCCESS" if self._gsvimagetest() else "FAIL")
            print("gsvurltest: %s" % "SUCCESS" if self._gsvurltest() else "FAIL")
        except:
            print("Implementation error in GSVTesting:", sys.exc_info()[0])

    gsvtestmock = '{"google":{"maps":{"Animation":{"BOUNCE":1,"DROP":2,"Co":3,"xo":4},"ControlPosition":{"TOP_LEFT":1,"TOP_CENTER":2,"TOP":2,"TOP_RIGHT":3,"LEFT_CENTER":4,"LEFT_TOP":5,"LEFT":5,"LEFT_BOTTOM":6,"RIGHT_TOP":7,"RIGHT":7,"RIGHT_CENTER":8,"RIGHT_BOTTOM":9,"BOTTOM_LEFT":10,"BOTTOM_CENTER":11,"BOTTOM":11,"BOTTOM_RIGHT":12,"CENTER":13},"MapTypeControlStyle":{"DEFAULT":0,"HORIZONTAL_BAR":1,"DROPDOWN_MENU":2,"INSET":3,"INSET_LARGE":4},"MapTypeId":{"ROADMAP":"roadmap","SATELLITE":"satellite","HYBRID":"hybrid","TERRAIN":"terrain"},"NavigationControlStyle":{"DEFAULT":0,"SMALL":1,"ANDROID":2,"ZOOM_PAN":3,"Do":4,"fk":5},"ScaleControlStyle":{"DEFAULT":0},"StreetViewPreference":{"NEAREST":"nearest","BEST":"best"},"StreetViewSource":{"DEFAULT":"default","OUTDOOR":"outdoor"},"StrokePosition":{"CENTER":0,"INSIDE":1,"OUTSIDE":2},"SymbolPath":{"CIRCLE":0,"FORWARD_CLOSED_ARROW":1,"FORWARD_OPEN_ARROW":2,"BACKWARD_CLOSED_ARROW":3,"BACKWARD_OPEN_ARROW":4},"ZoomControlStyle":{"DEFAULT":0,"SMALL":1,"LARGE":2,"fk":3},"event":{},"DirectionsStatus":{"OK":"OK","UNKNOWN_ERROR":"UNKNOWN_ERROR","OVER_QUERY_LIMIT":"OVER_QUERY_LIMIT","REQUEST_DENIED":"REQUEST_DENIED","INVALID_REQUEST":"INVALID_REQUEST","ZERO_RESULTS":"ZERO_RESULTS","MAX_WAYPOINTS_EXCEEDED":"MAX_WAYPOINTS_EXCEEDED","NOT_FOUND":"NOT_FOUND"},"DirectionsTravelMode":{"DRIVING":"DRIVING","WALKING":"WALKING","BICYCLING":"BICYCLING","TRANSIT":"TRANSIT"},"DirectionsUnitSystem":{"METRIC":0,"IMPERIAL":1},"DistanceMatrixStatus":{"OK":"OK","INVALID_REQUEST":"INVALID_REQUEST","OVER_QUERY_LIMIT":"OVER_QUERY_LIMIT","REQUEST_DENIED":"REQUEST_DENIED","UNKNOWN_ERROR":"UNKNOWN_ERROR","MAX_ELEMENTS_EXCEEDED":"MAX_ELEMENTS_EXCEEDED","MAX_DIMENSIONS_EXCEEDED":"MAX_DIMENSIONS_EXCEEDED"},"DistanceMatrixElementStatus":{"OK":"OK","NOT_FOUND":"NOT_FOUND","ZERO_RESULTS":"ZERO_RESULTS"},"ElevationStatus":{"OK":"OK","UNKNOWN_ERROR":"UNKNOWN_ERROR","OVER_QUERY_LIMIT":"OVER_QUERY_LIMIT","REQUEST_DENIED":"REQUEST_DENIED","INVALID_REQUEST":"INVALID_REQUEST","to":"DATA_NOT_AVAILABLE"},"GeocoderLocationType":{"ROOFTOP":"ROOFTOP","RANGE_INTERPOLATED":"RANGE_INTERPOLATED","GEOMETRIC_CENTER":"GEOMETRIC_CENTER","APPROXIMATE":"APPROXIMATE"},"GeocoderStatus":{"OK":"OK","UNKNOWN_ERROR":"UNKNOWN_ERROR","OVER_QUERY_LIMIT":"OVER_QUERY_LIMIT","REQUEST_DENIED":"REQUEST_DENIED","INVALID_REQUEST":"INVALID_REQUEST","ZERO_RESULTS":"ZERO_RESULTS","ERROR":"ERROR"},"KmlLayerStatus":{"UNKNOWN":"UNKNOWN","OK":"OK","INVALID_REQUEST":"INVALID_REQUEST","DOCUMENT_NOT_FOUND":"DOCUMENT_NOT_FOUND","FETCH_ERROR":"FETCH_ERROR","INVALID_DOCUMENT":"INVALID_DOCUMENT","DOCUMENT_TOO_LARGE":"DOCUMENT_TOO_LARGE","LIMITS_EXCEEDED":"LIMITS_EXECEEDED","TIMED_OUT":"TIMED_OUT"},"MaxZoomStatus":{"OK":"OK","ERROR":"ERROR"},"StreetViewStatus":{"OK":"OK","UNKNOWN_ERROR":"UNKNOWN_ERROR","ZERO_RESULTS":"ZERO_RESULTS"},"TrafficModel":{"BEST_GUESS":"bestguess","OPTIMISTIC":"optimistic","PESSIMISTIC":"pessimistic"},"TransitMode":{"BUS":"BUS","RAIL":"RAIL","SUBWAY":"SUBWAY","TRAIN":"TRAIN","TRAM":"TRAM"},"TransitRoutePreference":{"LESS_WALKING":"LESS_WALKING","FEWER_TRANSFERS":"FEWER_TRANSFERS"},"TravelMode":{"DRIVING":"DRIVING","WALKING":"WALKING","BICYCLING":"BICYCLING","TRANSIT":"TRANSIT"},"UnitSystem":{"METRIC":0,"IMPERIAL":1},"version":"3.32.11","visualization":{"MapsEngineStatus":{"OK":"OK","INVALID_LAYER":"INVALID_LAYER","UNKNOWN_ERROR":"UNKNOWN_ERROR"}},"geometry":{"encoding":{},"spherical":{},"poly":{}}}}}'
    gsvimagetestmock = imageio.imread('django_website/Testing/gsvimagetestmock.png')
    gsvurltestmock = 'https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180.000000&pitch=-0.760000&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m - xHYac'

    def _gsvtest(self):
        #contents = urllib.request.urlopen("http://localhost:1337/gsvtest").read()
        try:
            contents = requests.get("http://localhost:1337/gsvtest").text
        except requests.ConnectionError:
            #print("Connection error on port 1337, trying port 3000.")
            try:
                contents = requests.get("http://localhost:3000/gsvtest").text
            except requests.ConnectionError:
                print("Connection error on ports 1337 and 3000. The Node server is running?")
                return False
        except:
            print("Error in _gsvtest: ", sys.exc_info()[0])
            return False
        return self.gsvtestmock == contents

    def _gsvimagetest(self):
        data = requests.get(self.gsvurltestmock).content
        img_arr = np.array(imageio.imread(BytesIO(data)))
        mockimg = np.array(self.gsvimagetestmock)
        summed = np.sum(img_arr-mockimg)
        return summed == 0

    def _gsvurltest(self):
        imageMiner = ImageMinerManager()
        size = {"width": 640, "height": 640}
        location = {"lat": -23.560271, "lon": -46.731295}
        heading = 180
        pitch=-0.76
        testurl = GoogleStreetViewMiner._GoogleStreetViewMiner__imageURLBuilder(size, location, heading, pitch, GoogleStreetViewMiner._GoogleStreetViewMiner__key)
        return self.gsvurltestmock == testurl


