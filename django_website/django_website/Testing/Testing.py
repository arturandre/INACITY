#django_website.Testing

from django_website.Testing.mocks import *
import requests
import sys
from io import BytesIO
import imageio
import numpy as np
from django_website.ImageMiners.GoogleStreetViewMiner import GoogleStreetViewMiner
from django_website.MapMiners import *
from django_website.Managers import *
#from django_website.Managers.ImageMinerManager import ImageMinerManager
from django.contrib.gis.geos import Polygon
import json
from itertools import chain


from difflib import SequenceMatcher
def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()


class Testing(object):
    """Automated testing functions related to Google Street View image platform

    How to use:
    from django_website.Testing.Testing import * 
    Testing().testAll()
"""
    sampleregion = {"crs": {"properties": {"name": "EPSG:4326"}, "type": "name"}, "features": [{"geometry": {"coordinates": [[[-46.70459747314453, -23.536094368220105], [-46.69953346252441, -23.523424616467295], [-46.713352203369126, -23.51878135855857], [-46.71841621398925, -23.531451557329774], [-46.70459747314453, -23.536094368220105]]], "type": "Polygon"}, "id": "region0", "properties": {"type": "region"}, "type": "Feature"}], "type": "FeatureCollection"}


    def testAll(self):
        try:
            tests = [
                ("mapMinerManager_requestQueryToMapMiner", 
                self._mapMinerManager_requestQueryToMapMiner),
                ("gsvtest", self._gsvtest), 
                ("gsvimagetest", self._gsvimagetest),
                ("gsvurltest", self._gsvurltest)]
            failedTests = []
            lastTest = 0
            for testNo, test in enumerate(tests):
                lastTest = testNo
                if (test[1]()):
                    testResult = "SUCCESS"
                else:
                    failedTests.append(test[0])
                    testResult = "FAIL"
                print("%s: %s" % (test[0], testResult))
            if len(failedTests) > 0:
                print("Failed tests: %s" % ", ".join(failedTests))
            else:
                print("All tests have been passed.")
        except:
            print("Implementation error in Testing:", sys.exc_info()[0])
            print("While testing: %s" % tests[lastTest][0])
            pass
    
    def _mergewaystest(self):
        waysNodes = [[413363713, 2462816571, 1933826524, 1934482852, 2462816559, 413363700, 2462816555, 413363703, 2466638005, 415141575], [415141575, 747616486, 413363695], [413363724, 5019878603, 1933826452, 2466638025, 413363698], [413363695, 1934482872, 413363753, 4619786582, 413363875, 2871610415, 1484707526, 415513180, 1484707528, 413363885, 2871604420, 2871604419, 2871604421, 413363697, 2871594853, 1484707546, 413363892], [413363724, 2466638020, 2462816574, 413363713]]
        waysNodes2 = [[26592911, 5478170514, 2421037071, 2463889833, 370854731], [370800617, 679604938, 370857290, 1067411044, 4369891157, 370800387, 1397984548, 2463889820, 370854749], [370854731, 1397984555, 370851863, 1397984521, 597252, 1067411510, 370852185, 370800024, 467944945, 1538575982, 5022184040, 5022184043, 1489531930, 5478170509, 415513351, 26592442, 142851213], [370854749, 2421037081, 2466086504, 26592435]]

        OSMMiner()._mergeWays(waysNodes)
        OSMMiner()._mergeWays(waysNodes2)
        return (waysNodes == mergewaysmock) and (waysNodes2 == mergewaysmock2)

    def _mapMinerManager_requestQueryToMapMiner(self):
        streets = MapMinerManager().requestQueryToMapMiner(OSMMiner.mapMinerName, 'Streets', Testing.sampleregion)
        return streets.__str__() == mapminermanager_getstreetsmock



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
        return gsvtestmock == contents

    def _gsvimagetest(self):
        data = requests.get(gsvurltestmock).content
        img_arr = np.array(imageio.imread(BytesIO(data)))
        mockimg = np.array(gsvimagetestmock)
        summed = np.sum(img_arr-mockimg)
        return summed == 0

    def _gsvurltest(self):
        size = {"width": 640, "height": 640}
        location = {"lat": -23.560271, "lon": -46.731295}
        heading = 180
        pitch=-0.76
        testurl = GoogleStreetViewMiner._imageURLBuilder(size, location, heading, pitch, GoogleStreetViewMiner._key)
        return gsvurltestmock == testurl