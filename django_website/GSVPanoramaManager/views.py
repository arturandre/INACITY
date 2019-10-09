from rest_framework.decorators import api_view
from rest_framework.response import Response


from django.http import HttpResponse

from .db import DBManager

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
    return HttpResponse("getPanoramasByAddressList")

@api_view(['POST'])
def insertPanorama(request):
    #JSON data
    streetviewpanoramadata = request.data
    
    dbmanager = DBManager()
    dbmanager.insertPanorama(streetviewpanoramadata)
    dbmanager.close()

    return HttpResponse("insertPanorama")