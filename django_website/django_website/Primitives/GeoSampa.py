from django.contrib.gis.db import models

class GeoSampa_BusStops(models.Model):
    """
    Model class for GeoSampa Bus Stops Shapefile
    Source shapefile: SAD69-96_SHP_pontoonibus_point.shp
    Ref. URL: http://spatialreference.org/ref/epsg/sad69-utm-zone-23s/
    ProjectionId: EPSG:29183

    fields:
        - address : str
            The address of the bus stop
        - description : str
            Same as address, but eventually
            contains aditional details
        - name : str
            The bus stop name, a reference
            that can be used to search for the
            bus stop at the system of SPTrans.

    """

    address = models.CharField(max_length=150)
    description = models.CharField(max_length=150)
    name = models.CharField(max_length=150)
    
    #: GeoDjango-specific: a geometry field (PointField)
    mpoint = models.PointField(srid=29183)

    
    def __str__(self):
        """
        Overrides the default string
        representation of the model
        which in this case will be
        its name 'GeoSampa'.

        """
        return self.name


