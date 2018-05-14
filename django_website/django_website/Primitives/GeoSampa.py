from django.contrib.gis.db import models

class GeoSampa_BusStops(models.Model):
    """Model class for GeoSampa Bus Stops Shapefile"""
    #SAD69-96_SHP_pontoonibus_point.shp
    #http://spatialreference.org/ref/epsg/sad69-utm-zone-23s/
    #EPSG:29183
    address = models.CharField(max_length=150)
    description = models.CharField(max_length=150)
    name = models.CharField(max_length=150)
#    lon = models.FloatField()
#    lat = models.FloatField()
    
    # GeoDjango-specific: a geometry field (PointField)
    mpoint = models.PointField(srid=29183)

    # Returns the string representation of the model.
    def __str__(self):
        return self.name


