import imageio
import numpy as np
from typing import List
import json
import geojson

class SimpleDTO(object):
    """Base class used to add a simple JSON serializer to its subclasses"""
    def __init__(self):
        pass

    def toJSON(self, compact=True):
        """Serialize any object that can be represented as a dict"""
        if compact:
            return json.dumps(self, default=lambda o: o.__dict__, 
                sort_keys=True, separators=(',', ':'))
        else:
            return json.dumps(self, default=lambda o: o.__dict__, 
                sort_keys=True, indent=4)