import geojson
import django.contrib.gis.geos as geos
from django_website.MapMiners import MapMiner
from django_website.models import GeoSampa_BusStops


class GeoSampaMiner(MapMiner):
    """Miner for the GeoSampa's database"""

    mapMinerName = "GeoSampa"
    mapMinerId = "GEOSAMPA"
    ret = GeoSampa_BusStops.objects.all()[:0]
    def _getBusStops(regions: FeatureCollection) -> MultiPoint:
        for feature in regions['features']:
            geom = geos.Polygon(feature['geometry']['coordinates'])
            partial = GeoSampa_BusStops.objects.filter(mpoint__within=geom)
            #TODO: Replace union with Collect //https://docs.djangoproject.com/en/2.0/ref/contrib/gis/geoquerysets/#intersects
            ret = ret.union(partial)
        return ret

    _availableQueries = {"BusStops": _getBusStops}



