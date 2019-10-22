from rest_framework.decorators import api_view
from rest_framework.response import Response


from django.http import HttpResponse, JsonResponse

from .db import DBManager

#path('getAverageDensityBy', getAverageDensityByBoundingBox, name='getAverageDensityByBoundingBox'),
#path('getAverageDensityBy', getAverageDensityByAddress, name='getAverageDensityByAddress'),
#path('getAverageDensityBy', getAverageDensityByAddressList, name='getAverageDensityByAddressList'),

#path('getFilterResultsByAddress', getFilterResultsByAddressList, name='getFilterResultsByAddressList'),
#path('getFilterResultsByAddressList', getFilterResultsByAddressList, name='getFilterResultsByAddressList'),
#path('getFilterResultsByBoundingBox', getFilterResultsByBoundingBox, name='getFilterResultsByBoundingBox'),

#path('getPanoramasByBoundingBox', getPanoramasByBoundingBox, name='getPanoramasByBoundingBox'),
#path('getPanoramasByAddress', getPanoramasByAddress, name='getPanoramasByAddress'),

@api_view(['POST'])
def getPanoramasByAddressList(request):
    """
    End-point for collecting panoramas
    for each address in a list of address.

    If there are two or more equal addresses
    assotiated to distinct subgraphs then
    for those colliding addresses there will
    be multiple subgraphs returned response.

    To avoid the colliding problem one coordinate
    point (latitude longitude) can be passed together
    with each street, so that only the nearest subgraph
    will be returned.


    Parameters
    ----------
    request : HttpRequest
        A basic HTTP request.

    Returns
    -------
    none
    """
    addresslist = request.data['addresslist']
    dbmanager = DBManager()
    result = {}
    for address in addresslist:
        result[address] = dbmanager.retrieve_panoramas_for_street(address)
    return JsonResponse(result)
    #return HttpResponse("getPanoramasByAddressList")

@api_view(['POST'])
def insertPanorama(request):
    #JSON data
    streetviewpanoramadata = request.data
    
    dbmanager = DBManager()
    result = dbmanager.insert_panorama(streetviewpanoramadata)
    dbmanager.close()

    return HttpResponse(result)

@api_view(['POST'])
def getPanoramaById(request):
    #JSON data
    streetviewpanoramaid = request.data['pano']
    
    dbmanager = DBManager()
    result = dbmanager.retrieve_panorama_by_id(streetviewpanoramaid)
    dbmanager.close()

    return HttpResponse(result)