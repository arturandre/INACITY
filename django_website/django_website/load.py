import os
from django.contrib.gis.utils import LayerMapping
from django_website.Primitives.GeoSampa import GeoSampa_BusStops

geosampa_busstops_mapping = {
    
    'address' : 'pt_enderec',
    'description' : 'pt_descric',
    'name' : 'pt_nome',
    'mpoint' : 'POINT',
}

pontoonibus_shp = os.path.abspath(
    os.path.join(os.path.dirname(__file__), 'GeoDatabases','GeoSampa','Pontos_onibus','SAD69-96_SHP_pontoonibus', 'SAD69-96_SHP_pontoonibus_point.shp')
)

def run(verbose=True):
    lm = LayerMapping(
        GeoSampa_BusStops, pontoonibus_shp, geosampa_busstops_mapping,
        source_srs=29183, transform=True, encoding='utf-8',
    )
    if GeoSampa_BusStops.objects.count() == 0:
        lm.save(strict=True, verbose=verbose)
    else:
        print("GeoSampa_BusStops has data already. Loading canceled!")