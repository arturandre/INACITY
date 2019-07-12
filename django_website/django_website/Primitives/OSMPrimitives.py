from decimal import *
import time
from typing import List
from datetime import datetime
import json
from itertools import groupby
from dateutil.parser import parse

def _ElementJsonToOSMObject(jsonDict):
    """
    Parses an OpenStreetMap object into an :class:`OSMNode`, :class:`OSMWay` or :class:`OSMRelation`.

    Parameters
    ----------

    jsonDict : dict
        The dict object representing one of the OpenStreetMap objects

    Returns
    -------
    :class:`OSMNode`, :class:`OSMWay` or :class:`OSMRelation`
    
    """
    if jsonDict['type'] == 'node':
        return OSMNode(jsonDict['id'], jsonDict['type'], jsonDict['lat'], jsonDict['lon'], jsonDict.get('tags'))
    elif jsonDict['type'] == 'way':
        return OSMWay(jsonDict['id'], jsonDict['type'], jsonDict['nodes'], jsonDict.get('tags'))
    elif jsonDict['type'] == 'relation':
        return OSMRelation(jsonDict['id'], jsonDict['type'], _JsonMemberListToOSMRelationMember(jsonDict['members']), jsonDict.get('tags'))
    else:
            raise Exception("OSM Element type (%s) not implemented!" % jsonDict['type'])

def _JsonMemberListToOSMRelationMember(self, jsonMemberList):
    """
    Parses an OSMRelationMember dict into an OSMRelationMember object.

    Parameters
    ----------

    jsonMemberList : dict
        The dict object representing an :class:`OSMRelationMember`.

    Returns
    -------
    An arrays containing each parsed :class:`OSMRelationMember`.
    
    """
    members = []
    for member in jsonMemberList:
        members.append(OSMRelationMember(member['type'], member['ref'], member['role']))
    return members


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
    """
    Class used as an OpenStreetMap Node object wrapper

    fields:
        - lat : Decimal
            Represents this OSMNode latitude
        - lon : Decimal
            Represents this OSMNode longitude
        - tags : dict
            Each :class:`OSMNode`, :class:`OSMWay` and :class:`OSMRelation` can
            contain an arbitratry number of tags, each of which corresponds to
            some attribute of that OSM object (e.g. an OSMNode could
            have a tag 'highway' with the value 'traffic_signals').
    """
    def __init__(self, id: int, type: str, lat: Decimal, lon: Decimal, tags={}):
        super().__init__(id, type, tags)
        self.lat = lat
        self.lon = lon

class OSMWay(OSMObject):
    """
    Class used as an OpenStreetMap Way object wrapper.
    In this abstraction an OSMWay is only considered to be a set
    of nodes contained in the field nodes.

    fields:
        - nodes : List[int]
            The set of nodes contained in this OSMWay. An OSMWay
            is used to represent usually linear features such 
            as avenues and streets.
        - tags : dict
            See tags in :class:`OSMNode`
    """
    def __init__(self, id: int, type,  nodes: List[int], tags={}):
        super().__init__(id, type, tags)
        self.nodes = nodes

class OSMRelation(OSMObject):
    """
        A OpenStreetMap relation represents 'belongs to' relations (i.e. :class:`OSMNode` objects belonging
        to the same :class:`OSMWay` or a collection of :class:`OSMWay` objects that belongs to the same
        OSMRelation which represets for example the boundaries of some region.)

        fields:
            - id : int
                Represents the relation id as informed by OpenStreetMap database
            - type : str
                It can be anything for example 'boundary'.
            - members : List[OSMObject]
                An OSMRelation can be composed by any number and type of objects
                (e.g. an OSMRelation with type 'route' can contain different
                OSMWays that compose the route of a bus).
    """
    def __init__(self, id: int, type, members: List[OSMObject], tags={}):
        super().__init__(id, type, tags)
        self.members = members

class OSM3S:
    """Timestamp and copyright info"""
    def __init__(self, timestamp_osm_base = None, copyright = ""):
        if not timestamp_osm_base is None:
            self.timestamp_osm_base = parse(timestamp_osm_base)
        self.copyright = copyright

    def JsonToOSM3S(jsonString):
        """Parses an string to an OSM3S object"""
        return DictToOSM3S(json.loads(jsonString));

    def DictToOSM3S(jsonDict):
        """Parses an dict object into an OSM3S object"""
        return OSM3S(jsonDict['timestamp_osm_base'], jsonDict['copyright'])

class OSMRelationMember:
    """An element that 'belogs' to another (i.e. An :class:`OSMNode` that belongs to an :class:`OSMWay`)"""
    def __init__(self, type, ref, role):
        self.type = type
        self.ref = ref
        self.role = role

class OSMResult:
    """Represents a query result to an OpenStreetMap server"""
    def __init__(self, version: float, generator: str, osm3s: OSM3S, elements: list = []):
        self.version = version
        self.generator = generator
        self.osm3s = osm3s
        self.Nodes = {}
        self.Ways = {}
        self.Relations = {}
        for element in elements:
            osmObject = _ElementJsonToOSMObject(element)
            if type(osmObject) is OSMNode: self.Nodes[osmObject.id] = osmObject
            elif type(osmObject) is OSMWay:
                self.Ways[osmObject.id] = osmObject
            elif type(osmObject) is OSMRelation:
                self.Relations[osmObject.id] = osmObject

    def fromJsonString(jsonString):
        """Parses a json string into a OSMResult object"""
        return OSMResult.fromJsonDict(json.loads(jsonString))

    def fromJsonDict(jsonDict):
        """Parses a dict into a OSMResult"""
        version = jsonDict['version']
        generator = jsonDict['generator']
        osm3sDict = OSM3S.DictToOSM3S(jsonDict['osm3s'])
        return OSMResult(version, generator, osm3sDict, jsonDict['elements'])
        

            
