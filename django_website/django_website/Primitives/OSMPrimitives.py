from decimal import *
import time
from typing import List
from datetime import datetime
import json
from itertools import groupby

def parseTimeString(timestamp):
        return datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%SZ")

class OSMObject(object):
    """Base class for other OSM objects:
        Attribute Name: default value
        version: 0
        visible: True
        timestamp: None
        changeset: 0
        user: '' #user's name
        uid: 0 #user's id
        """

    _optDefAttributes={"version": 0, "visible": True, "timestamp": None, "changeset": 0,
        "user": "", "uid": 0}

    ##  'tags' attribute is set as an empty dictionary so that it's possible to try 
    ##  to look up for a 'name' tag even when an (faulty) object doesn't have any tags
    def __init__(self, id: int, type:str, tags={}, **kwargs):
        self.id = id
        self.type = type
        self.tags = tags
        for kw in OSMObject._optDefAttributes:
            setattr(self, kw, kwargs.get('kw') if kw in kwargs else OSMObject._optDefAttributes.get('kw'))


class OSMNode(OSMObject):
    """Class used as an OpenStreetMap Node object wrapper"""
    def __init__(self, id: int, type: str, lat: Decimal, lon: Decimal, tags={}):
        super().__init__(id, type, tags)
        self.lat = lat
        self.lon = lon

class OSMWay(OSMObject):
    """Class used as an OpenStreetMap Way object wrapper"""
    def __init__(self, id: int, type,  nodes: List[int], tags={}):
        super().__init__(id, type, tags)
        self.nodes = nodes

class OSMRelation(OSMObject):
    """Class used as an OpenStreetMap Way object wrapper"""
    def __init__(self, id: int, type, members: List[OSMObject], tags={}):
        super().__init__(id, type, tags)
        self.members = members

class OSM3S:
    def __init__(self, timestamp_osm_base, copyright):
        self.timestamp_osm_base = parseTimeString(timestamp_osm_base)
        self.copyright = copyright

    #Class method
    def JsonToOSM3S(jsonString):
        return OSM3S.DictToOSM3S(json.loads(jsonString));

    #Class method
    def DictToOSM3S(jsonDict):
        return OSM3S(jsonDict['timestamp_osm_base'], jsonDict['copyright'])

class OSMRelationMember:
    def __init__(self, type, ref, role):
        self.type = type
        self.ref = ref
        self.role = role

class OSMResult:
    def __init__(self, version: float, generator: str, osm3s: OSM3S, elements: list):
        self.version = version
        self.generator = generator
        self.osm3s = osm3s
        self.Nodes = {}
        self.Ways = {}
        self.Relations = {}
        for element in elements:
            osmObject = OSMResult._ElementJsonToOSMObject(element)
            if type(osmObject) is OSMNode: self.Nodes[osmObject.id] = osmObject
            elif type(osmObject) is OSMWay:
                self.Ways[osmObject.id] = osmObject
            elif type(osmObject) is OSMRelation:
                self.Relations[osmObject.id] = osmObject

    #Class method
    def fromJsonString(jsonString):
        return OSMResult.fromJsonDict(json.loads(jsonString))

    #Class method
    def fromJsonDict(jsonDict):
        version = jsonDict['version']
        generator = jsonDict['generator']
        osm3sDict = OSM3S.DictToOSM3S(jsonDict['osm3s'])
        return OSMResult(version, generator, osm3sDict, jsonDict['elements'])
        

    #Class method
    def _ElementJsonToOSMObject(jsonDict):
        if jsonDict['type'] == 'node':
            return OSMNode(jsonDict['id'], jsonDict['type'], jsonDict['lat'], jsonDict['lon'], jsonDict.get('tags'))
        elif jsonDict['type'] == 'way':
            return OSMWay(jsonDict['id'], jsonDict['type'], jsonDict['nodes'], jsonDict.get('tags'))
        elif jsonDict['type'] == 'relation':
            return OSMRelation(jsonDict['id'], jsonDict['type'], OSMResult._JsonMemberListToOSMRelationMember(jsonDict['members']), jsonDict.get('tags'))
        else:
             raise Exception("OSM Element type (%s) not implemented!" % jsonDict['type'])

    #Class method
    def _JsonMemberListToOSMRelationMember(jsonMemberList):
        members = []
        for member in jsonMemberList:
            members.append(OSMRelationMember(member['type'], member['ref'], member['role']))
        return members
            
