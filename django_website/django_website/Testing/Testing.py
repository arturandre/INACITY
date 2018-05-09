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
    """Automated testing functions related to Google Street View image platform"""

    def testAll(self):
        try:
            tests = [("mapMinerManager_getStreets", self._mapMinerManager_getStreets), ("osmminer_getStreets",self._osmminer_getStreets), ("gsvtest", self._gsvtest), ("gsvimagetest", self._gsvimagetest), ("gsvurltest", self._gsvurltest), ("osmminer_collectStreetsQuery", self._osmminer_collectStreetsQuery)]
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

    def _mapMinerManager_getStreets(self):
        poly = Polygon.from_ewkt('SRID=4326;POLYGON ((-23.55850936300801 -46.73320055007934, -23.55473281722144 -46.73105478286743, -23.55276582331022 -46.73517465591431, -23.55654242561994 -46.73732042312622, -23.55850936300801 -46.73320055007934))')
        streetsDTOList = MapMinerManager().getStreets(poly)
        streetsDTOJsonList = '[' + ",".join(map(lambda x: x.toJSON(), streetsDTOList)) + ']'
        return streetsDTOJsonList == mapmanager_getstreetsmock

    def _osmminer_getStreets(self):
        poly = Polygon.from_ewkt('POLYGON ((-23.62227134253228 -46.63661956787109, -23.60017200992538 -46.63661956787109, -23.60017200992538 -46.60443305969238, -23.62227134253228 -46.60443305969238, -23.62227134253228 -46.63661956787109))')
        streetsDTOList = OSMMiner.getStreets(poly)
        streetsDTOJsonList = '[' + ",".join(map(lambda x: x.toJSON(), streetsDTOList)) + ']'
        return streetsDTOJsonList == getstreetsmock

    def _osmminer_collectStreetsQuery(self):
        poly = Polygon.from_ewkt('POLYGON ((-23.62227134253228 -46.63661956787109, -23.60017200992538 -46.63661956787109, -23.60017200992538 -46.60443305969238, -23.62227134253228 -46.60443305969238, -23.62227134253228 -46.63661956787109))')
        jsonString = requests.get(OSMMiner()._createCollectStreetsQuery(poly)).content
        getstreetsresult = json.loads(jsonString)
        jsonmock = json.loads(osmgetstreetsmock)
        try:
            del getstreetsresult['osm3s']
            del jsonmock['osm3s']
        except KeyError:
            print("Error in _osmminer_collectStreetsQuery while trying to delete osm3s keys.")
            pass
        #As OSM is updated the similarity tends to decrease (2018-05-04: similarity=0.9994953100293219)
        return similar(getstreetsresult.__str__(), jsonmock.__str__()) > 0.9


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
        imageMiner = ImageMinerManager()
        size = {"width": 640, "height": 640}
        location = {"lat": -23.560271, "lon": -46.731295}
        heading = 180
        pitch=-0.76
        testurl = GoogleStreetViewMiner()._imageURLBuilder(size, location, heading, pitch, GoogleStreetViewMiner._key)
        return gsvurltestmock == testurl