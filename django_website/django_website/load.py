"""
This file exemplifies the manual insertion of
geographical data into INACITY backend's database.

The data to be inserted refers to bus stops
in the city of São Paulo-Brazil.

This data comes from the GeoSampa GIS and
is contained in a file named:
SAD69-96_SHP_pontoonibus_point.shp
"""

import os
from django.contrib.gis.utils import LayerMapping
from django_website.Primitives.GeoSampa import GeoSampa_BusStops

# The shapefile SAD69-96_SHP_pontoonibus_point.shp
# contains the fields on the right side,
# on the leftside are corresponding fields 
# in the Model defined to hold the data in the
# database, that is the GeoSampa_BusStops model.
geosampa_busstops_mapping = {
    
    'address' : 'pt_enderec',
    'description' : 'pt_descric',
    'name' : 'pt_nome',
    'mpoint' : 'POINT',
}

pontoonibus_shp = os.path.abspath(
    os.path.join(os.path.dirname(__file__), 'GeoDatabases','GeoSampa','Pontos_onibus','SAD69-96_SHP_pontoonibus', 'SAD69-96_SHP_pontoonibus_point.shp')
)

# This function is called during the server's initialization (by dockerfile and dockercompose)
def run(verbose=True):
    """
    Convenience function used to insert into the database
    data from the GeoSampa bus stops.

    Notice that the GeoSampa Bus Stops file has the 
    EPSG:29183 projection as its Source Reference
    System (SRS).

    Parameters
    ----------

    verbose=True : Boolean
        Displays messages related to the progress of the
        insertion.

    Returns
    -------
    none
    """
    lm = LayerMapping(
        GeoSampa_BusStops, pontoonibus_shp, geosampa_busstops_mapping,
        source_srs=29183, transform=True, encoding='utf-8',
    )
    if GeoSampa_BusStops.objects.count() == 0:
        lm.save(strict=True, verbose=verbose)
    else:
        print("GeoSampa_BusStops has data already. Loading canceled!")