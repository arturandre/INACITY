import geojson
from geojson import FeatureCollection, Point, Feature
import django.contrib.gis.geos as geos
from django.contrib.gis.gdal import SpatialReference, CoordTransform
from django_website.MapMiners import MapMiner
from django_website.models import GeoSampa_BusStops


class GeoSampaMiner(MapMiner):
    """Miner for the GeoSampa's database"""
    _basecrs = SpatialReference(29183)
    _crs = {
        "type": "name",
        "properties": {
            "name": "EPSG:29183"
        }
        }

    mapMinerName = "GeoSampa"
    mapMinerId = "GEOSAMPA"
    def _getBusStops(regions: FeatureCollection) -> [Point]:
        ret = GeoSampa_BusStops.objects.all()[:0]
        for feature in regions['features']:
            #This represents a simple exterior linear ring.  Interior rings are
            #not considered.
            geom = geos.Polygon(feature['geometry']['coordinates'][0], srid=int(regions['crs']['properties']['name'].split(':')[1]))
            partial = GeoSampa_BusStops.objects.filter(mpoint__within=geom)
            #TODO: Replace union with Collect
            #//https://docs.djangoproject.com/en/2.0/ref/contrib/gis/geoquerysets/#intersects
            ret = ret.union(partial)
        featuresList = []
        for busStop in ret.all():
            GeoSampaMiner._reproject(busStop.mpoint)
            featuresList.append(Feature(id=busStop.id,
                properties={'name':busStop.name,
                'description':busStop.description,
                'address':busStop.address},
                geometry=Point(busStop.mpoint)))
        return FeatureCollection(featuresList, crs=GeoSampaMiner._crs)

    def _initialize(cls):
        pass

    _availableQueries = {"BusStops": _getBusStops}



