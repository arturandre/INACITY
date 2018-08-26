from django.contrib.gis.db import models

class GeoSampa_BusStops(models.Model):
    """Model class for GeoSampa Bus Stops Shapefile

    Shapefile: SAD69-96_SHP_pontoonibus_point.shp

    URL: http://spatialreference.org/ref/epsg/sad69-utm-zone-23s/

    ProjectionId: EPSG:29183

    fields:
    - address: string indicating 
    """

    address = models.CharField(max_length=150)
    description = models.CharField(max_length=150)
    name = models.CharField(max_length=150)
    
    #: GeoDjango-specific: a geometry field (PointField)
    mpoint = models.PointField(srid=29183)

    
    def __str__(self):
        """Returns the string representation of the model."""
        return self.name


