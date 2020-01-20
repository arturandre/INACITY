from geojson import Point, LineString, MultiLineString, Polygon, Feature, FeatureCollection
from django.contrib.gis.gdal import SpatialReference
import requests
from typing import List

from django_website.MapMiners import MapMiner
from itertools import chain
import re
from dateutil.parser import parse
from threading import Lock
import sys

from django_website.LogGenerator import write_to_log

from django_website.geofunctions import flip_geojson_coordinates

from GSVPanoramaManager.db import DBManager
from django_website.Primitives.GeoImage import GeoImage
from django_website.settings_secret import GSV_KEY


class Size():
    def __init__(self, width, height):
        self.width = width
        self.height = height


class GSVPanoramaMiner(MapMiner):
    """
    GSVPanoramaMiner used to access panoramas stored by
    the GSVPanoramaManager django app.

    class members:
        Derived from MapMiner:
            - mapMinerName : 'GSVPanoramaMiner'
            - mapMinerId : 'GSVPanoramaMiner'
            - _basecrs : SpatialReference(4326)
    """

    mapMinerName = "GSVPanoramaMiner"
    mapMinerId = "GSVPanoramaMiner"

    # EPSG:4326
    # Since OpenLayers and GSVPanoramaMiner different SRID a convertion is needed
    _basecrs = SpatialReference(4326)
    _crs = {
        "type": "name",
        "properties": {
            "name": "EPSG:4326"
        }
    }

    _basecrs = SpatialReference(3857)
    _crs = {
        "type": "name",
        "properties": {
            "name": "EPSG:3857"
        }
    }

    def __init__(self):
        raise Exception(
            "This is a static class and should not be instantiated.")
        # pass

    @staticmethod
    def _get_bottom_left_top_right_corners(closedLineString):
        left = None
        right = None
        top = None
        bottom = None
        for c in closedLineString:
            if (left is None) or (c[0] < left):
                left = c[0]
            if (right is None) or (c[0] > right):
                right = c[0]
            if (bottom is None) or (c[1] < bottom):
                bottom = c[1]
            if (top is None) or (c[1] > top):
                top = c[1]

        return [left, bottom], [right, top]

    @staticmethod
    def _getPanoramasInBoundingBoxes(regions: FeatureCollection) -> MultiLineString:
        """Collect a set of Ways (from GSVPanoramaManager)
        and convert them to a MultiLineString"""

        neo4jDB = DBManager()

        featuresList = []

        for feature in regions['features']:
            geom = feature['geometry']
            assert type(geom is Polygon)
            singleLineString = geom.get('coordinates')[0]
            bottom_left, top_right = GSVPanoramaMiner._get_bottom_left_top_right_corners(
                singleLineString)
            result = neo4jDB.retrieve_panorama_subgraphs_in_bounding_box(
                bottom_left, top_right)
            addresses = dict.fromkeys(
                [d['r'].get('description') for d in result])
            addresses.pop(None, 'None')
            leftNodes = set()
            rightNodes = set()
            for record in result:
                try:
                    leftNode = record['left']
                    rightNode = record['right']
                    arrow = record['r']
                    if (arrow['description'] in leftNode['description'])\
                            and (arrow['description'] in rightNode['description']):
                        if leftNode['pano'] in leftNodes:
                            continue
                        address = addresses[arrow['description']]
                        if address is None:
                            address = addresses[arrow['description']] = {}
                        linestrings = address.get('linestrings')

                        leftNodeProps = leftNode.__dict__['_properties'].copy()
                        leftNodeProps['heading'] = arrow.get('heading')

                        rightNodeProps = rightNode.__dict__[
                            '_properties'].copy()
                        # Temporarily sets the heading of the last node from a
                        # linestring. If a 'new' last node is found then
                        # this heading will be updated (following the arrow)
                        rightNodeProps['heading'] = arrow.get('heading')

                        if linestrings is None:
                            address['linestrings'] = []
                            linestrings = address.get('linestrings')

                            linestrings.append([
                                leftNodeProps,
                                rightNodeProps
                            ])
                            leftNodes.add(leftNodeProps['pano'])
                            rightNodes.add(rightNodeProps['pano'])

                        else:
                            # This segment merges two linestrings already
                            # added
                            if (leftNodeProps['pano'] in rightNodes)\
                                    and (rightNodeProps['pano'] in leftNodes):
                                leftLinestringIdx = None
                                rightLinestringIdx = None
                                counter = -1
                                for linestring in linestrings:
                                    counter = counter + 1
                                    # Notice that only one direction
                                    # can be extended at once
                                    # so if backward arrows are found
                                    # they will be discarded since they
                                    # require both directions to be treated
                                    # in a single check.
                                    if linestring[-1]['pano'] == leftNodeProps['pano']:
                                        leftLinestringIdx = counter
                                    elif linestring[0]['pano'] == rightNodeProps['pano']:
                                        rightLinestringIdx = counter
                                    else:
                                        continue
                                    if (leftLinestringIdx is not None)\
                                            and (rightLinestringIdx is not None):
                                        linestrings[leftLinestringIdx] = \
                                            linestrings[leftLinestringIdx] +\
                                            linestrings[rightLinestringIdx]
                                        linestrings.pop(rightLinestringIdx)
                                        #leftLinestring = leftLinestring + rightLinestring
                                        break
                            # The line can be extended to the right
                            elif leftNodeProps['pano'] in rightNodes:
                                for linestring in linestrings:
                                    if linestring[-1]['pano'] == leftNodeProps['pano']:
                                        print(
                                            f"extending (->) {linestring[-1]['pano']} with {rightNodeProps['pano']}")
                                        # this updates the heading
                                        linestring[-1] = leftNodeProps
                                        # Updating the nodes that have been found as
                                        # left nodes. This keeps the navigation
                                        # consistently following a single direction.
                                        leftNodes.add(leftNodeProps['pano'])
                                        rightNodes.add(rightNodeProps['pano'])
                                        linestring.append(rightNodeProps)
                            # The line can be extended to the left
                            elif rightNodeProps['pano'] in leftNodes:
                                for linestring in linestrings:
                                    if linestring[0]['pano'] == rightNodeProps['pano']:
                                        print(
                                            f"extending (<-) {linestring[0]['pano']} with {leftNodeProps['pano']}")
                                        # This time the heading of the existing node doesn't
                                        # need to be updated.
                                        rightNodes.add(rightNodeProps['pano'])
                                        leftNodes.add(leftNodeProps['pano'])
                                        linestring.insert(0, leftNodeProps)
                            # A new linestring must be created
                            else:
                                linestrings.append([
                                    leftNodeProps,
                                    rightNodeProps
                                ])
                                leftNodes.add(leftNodeProps['pano'])
                                rightNodes.add(rightNodeProps['pano'])

                                # Pegar a lista de endereços presentes na consulta.
                                # Cada dois nós de um mesmo endereço definem um segmento.
                                # Um segmento pode ser extendido.
                                # Somente um sentido de cada rua é exibido.
                                # Se dois segmentos de uma mesma rua forem desconexos
                                # então esta rua será representada por 2 linestrings
                                # cada linestring tem sua própria orientação
                except TypeError:
                    if (arrow['description'] is None)\
                       or (rightNode['description'] is None)\
                       or (leftNode['description'] is None):
                        continue
                    else:
                        print("Unexpected error:", sys.exc_info()[0])
                        raise
                except:
                    print("Unexpected error:", sys.exc_info()[0])
                    raise
            for address in addresses:
                MLS=[]
                geoImageMLS = []
                if addresses[address] is None:
                    continue
                for linestring in addresses[address]['linestrings']:
                    LS=[]
                    geoImageLS=[]
                    for node in linestring:
                        geoJsonPoint=Point([node['location'].x,
                                              node['location'].y])
                        LS.append(geoJsonPoint)
                        geoImage=GeoImage.fromJSON({
                            'id': node['pano'],
                            'location': geoJsonPoint,
                            'heading': node['heading'],
                            'pitch': node.get('pitch', 0)
                        })
                        geoImage.data=GSVPanoramaMiner.\
                            _imageURLBuilderForGeoImage(geoImage)
                        geoImage.dataType='URL'
                        geoImageLS.append(geoImage)

                    MLS.append(LineString(LS))
                    geoImageMLS.append(geoImageLS)

                newFeature=Feature(id = address,
                                     properties = {
                                         'name': address,
                                         'geoImages': geoImageMLS
                                     },
                                     geometry = MultiLineString(MLS))
                featuresList.append(newFeature)


        return FeatureCollection(featuresList, crs = GSVPanoramaMiner._crs)
        # return StreetsDTOList

    @staticmethod
    def _imageURLBuilderForGeoImage(geoImage: GeoImage, size: Size = None, key: str = None):
        if size is None:
            size=Size(640, 640)
        if key is None:
            key=GSV_KEY
        return GSVPanoramaMiner._imageURLBuilder(
            size,
            geoImage.id,
            geoImage.heading,
            geoImage.pitch,
            key)

    @staticmethod
    # https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyCzw_81uL52LSQVYvXEpweaBsr3m%20-%20xHYac
    def _imageURLBuilder(size: Size, panoid: str, heading: float, pitch: float, key: str):
        write_to_log(f'_imageURLBuilder')
        baseurl="https://maps.googleapis.com/maps/api/streetview"
        queryString=(
            f"?size={size.width}x{size.height}"
            f"&pano={panoid}"
            f"&heading={heading}&pitch={pitch}&key={key}"
        )

        unsigned_url=baseurl + queryString
        # signed_url = GoogleStreetViewProvider._sign_url(unsigned_url)
        # print(f'signed_url: {signed_url}')
        # return signed_url
        return unsigned_url

    @classmethod
    def _initialize(cls):
        cls._availableQueries={'Panoramas': cls._getPanoramasInBoundingBoxes}
