from os import path

import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
import threading

import requests

from datetime import datetime
import time


import json
import geojson


import pyproj    
import shapely
import shapely.ops as ops
from shapely.geometry.polygon import Polygon
from shapely.geometry import shape
from functools import partial

server_domain = "http://dev.inacity.org/"
getmapminerfeatures_url = server_domain + "getmapminerfeatures/"
getimagesforfeature_url = server_domain + "getimagesforfeature/"
processimagesfromfeature_url = server_domain + "processimagesfromfeature/"

error_count = 0
max_error_tolerated = 3

thread_local = threading.local()

def get_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
    return thread_local.session

class RegionFeature(geojson.Feature):
    def __init__(self, id, coordinates, crs_name="EPSG:4326"):
        super().__init__()
        self.id = id
        self.type = "Feature"
        self.geometry = geojson.geometry.Polygon(coordinates=coordinates)
        self.properties = {}
        self.properties['type'] = 'region'
        self.crs = {}
        self.crs['type'] = 'name'
        self.crs['properties'] = {}
        self.crs['properties']['name'] = crs_name

# {"mapMinerId":"osm","featureName":"Streets","regions":"{\"type\":\"Feature\",\"id\":\"region1\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[-46.73293662058131,-23.55883341443848],[-46.73161482784781,-23.55883341443848],[-46.73161482784781,-23.55743296004958],[-46.73293662058131,-23.55743296004958],[-46.73293662058131,-23.55883341443848]]]},\"properties\":{\"type\":\"region\"},\"crs\":{\"type\":\"name\",\"properties\":{\"name\":\"EPSG:4326\"}}}"}
class MapMinerRequest():
    def __init__(self, mapMinerId, featureName, regions=None):
        # regions correspond to a single region (should not be in plural!)
        self.mapMinerId = mapMinerId
        self.featureName = featureName
        self.featureCollection = None
        self.logs = []
    def toJSON(self):
        aux = self.__dict__.copy()
        aux['regions'] = json.dumps(aux['regions'])
        return aux
        #return json.dumps(self.__dict__)
    def setRegion(self, id, coordinates, crs_name="EPSG:4326"):
        # id is a dummy variable used on the front-end
        # to disambiguate between different regions
        self.regions = RegionFeature(id, coordinates, crs_name)
    #@timebudget
    def collectStreets(self):
        session = get_session()
        #_response = requests.post(getmapminerfeatures_url, json=self.toJSON())
        _response = session.post(getmapminerfeatures_url, json=self.toJSON())
        if _response.ok:
                self.featureCollection = geojson.\
                    FeatureCollection.to_instance(
                        json.loads(_response.text))
    def processImagesFromFeatures(self, imageFilterId="greenery"):
        for i in range(len(self.featureCollection['features'])):
            feature = self.featureCollection['features'][i]
            self.featureCollection['features'][i] =\
                self._processImagesFromFeatures(feature, imageFilterId)['feature']
    def _processImagesFromFeatures(self, feature, imageFilterId="greenery"):
        session = get_session()
        request_params = {}
        request_params["imageFilterId"] = imageFilterId
        request_params["feature"] = json.dumps(feature)
        #_response = requests.post(getimagesforfeature_url, json=request_params)
        _response = session.post(processimagesfromfeature_url, json=request_params)
        if _response.ok:
            return json.loads(_response.text)
        else:
            print(f"Error: {_response.text[:100]}")
            with open('error_log.txt', 'a+') as f:
                f.write(str(datetime.now()) + "\n")
                f.write(_response.text + "\n")
            raise Exception(_response.text[:100])
    #@timebudget
    def collectImagesForFeatures(self, imageProviderName="gsvProvider"):
        for i in range(len(self.featureCollection['features'])):
            feature = self.featureCollection['features'][i]
            self.featureCollection['features'][i] = \
                self._collectImagesForFeature(feature, imageProviderName)['feature']
    def _collectImagesForFeature(self, feature, imageProviderName="gsvProvider"):
        session = get_session()
        request_params = {}
        request_params["imageProviderName"] = imageProviderName
        request_params["feature"] = json.dumps(feature)
        #_response = requests.post(getimagesforfeature_url, json=request_params)
        _response = session.post(getimagesforfeature_url, json=request_params)
        if _response.ok:
            return json.loads(_response.text)
        else:
            print(f"Error: {_response.text[:100]}")
            with open('error_log.txt', 'a+') as f:
                f.write(str(datetime.now()) + "\n")
                f.write(_response.text + "\n")
            raise Exception(_response.text[:100])
    def regionArea(self):
        geom = shape(self.regions['geometry'])
        geom_area = ops.transform(
            partial(
                pyproj.transform,
                pyproj.Proj(init='EPSG:4326'),
                pyproj.Proj(
                    proj='aea',
                    lat_1=geom.bounds[1],
                    lat_2=geom.bounds[3])),
            geom)
        return geom_area.area 
    def validImages(self):
        validImages = 0
        for feature in self.featureCollection['features']:
            feature = feature
            geoImages = feature['properties']['geoImages']
            subiterators = [0]
            subiteratorslen = []
            while True:
                if subiterators[0] >= len(geoImages):
                    break
                image = geoImages[subiterators[0]]
                for si in subiterators[1:]:
                    if si >= len(image):
                        subiterators.pop(-1)
                        subiterators[-1] += 1
                        break
                    image = image[si]
                if isinstance(image, list):
                    subiterators.append(0)
                    subiteratorslen.append(len(image))
                    continue
                if isinstance(image, str):
                    subiterators[-1] += 1
                    continue
                if image.get('id') is not None:
                    validImages += 1
                    subiterators[-1] += 1
        return validImages



# area: 20931.1 m^2 = 0.020931 km^2
area1 = [[
        [-46.73293662058131, -23.55883341443848],
        [-46.73161482784781, -23.55883341443848],
        [-46.73161482784781, -23.55743296004958],
        [-46.73293662058131, -23.55743296004958],
        [-46.73293662058131, -23.55883341443848]]]

# area: 20931.1 m^2 = 0.020931 km^2
area2 = [[
        [-46.71412253392918, -23.547629372033697],
        [-46.70888686193211, -23.547629372033697],
        [-46.70888686193211, -23.542089942489554],
        [-46.71412253392918, -23.542089942489554],
        [-46.71412253392918,-23.547629372033697]]]
mapMinerRequests = []
mapMinerRequest1 = MapMinerRequest(
    mapMinerId="osm",
    featureName="Streets"
    )
mapMinerRequest1.setRegion(id="region1",
    coordinates=area1
        )

#mapMinerRequests.append(mapMinerRequest1)
#mapMinerRequest1.collectStreets()
#print(f"{len(mapMinerRequest1.featureCollection['features'])} features collected.")
#mapMinerRequest1.collectImagesForFeatures()
#print(f"{mapMinerRequest1.validImages()} valid images collected")
#mapMinerRequest1.processImagesFromFeatures()


mapMinerRequest2 = MapMinerRequest(
    mapMinerId="osm",
    featureName="Streets"
    )
mapMinerRequest2.setRegion(id="region2",
    coordinates=area2
        )




def run(mmr):
    global error_count
    global max_error_tolerated
    p = {}
    p['timestamp'] = str(datetime.now())
    p['error'] = "False"
    try:
        p['area_m2'] = str(mmr.regionArea())
        print(f"Area: {p['area_m2']} m^2.")
        s = time.time()
        mmr.collectStreets()
        t = time.time()
        p['collectStreets_time'] = str(t-s)
        print(f"collectStreets time: {p['collectStreets_time']}")
        p['collectStreets_features'] = str(len(mmr.featureCollection['features']))
        print(f"{p['collectStreets_features']} features collected.")
        s = time.time()
        mmr.collectImagesForFeatures()
        t = time.time()
        p['collectImagesForFeatures_time'] = str(t-s)
        print(f"collectImagesForFeatures time: {p['collectImagesForFeatures_time']}")
        p['validImages'] = str(mmr.validImages())
        print(f"{p['validImages']} valid images collected")
        s = time.time()
        mmr.processImagesFromFeatures()
        t = time.time()
        p['process_time'] = str(t-s)
        print(f"process_time time: {p['process_time']}")
    except Exception as error:
        p['error'] = 'True'
        error_count += 1
        with open('error_log.txt', 'a+') as f:
            f.write(str(datetime.now()) + "\n")
            f.write(str(type(error)) + "\n")
            f.write(str(error.args) + "\n")
            f.write(str(error) + "\n")
        if error_count >= max_error_tolerated:
            raise Exception("Max error count achieved! Aborting!")
    finally:
        return p

repetitions = 100    
for i in range(repetitions):
    mmr = MapMinerRequest(*["osm", "Streets"])
    mmr.setRegion(id=f'region{i}', coordinates=[area1, area2][i%2])
    mapMinerRequests.append(mmr)

headers = "timestamp|error|area_m2|time streets|num streets|time images|num images|process_time"

write_headers = not path.exists('results.csv')
writer_lock = threading.Lock()

with open('results.csv', 'a+') as f:
    #with ThreadPoolExecutor(max_workers=10) as executor:
    with ThreadPoolExecutor(max_workers=1) as executor:
        for p in executor.map(run, mapMinerRequests):
            with writer_lock:
                if write_headers:
                    write_headers = False
                    #header
                    f.write(headers)
                    f.write('\n')
                f.write("|".join(p.values()))
                f.write('\n')
                f.flush()





        