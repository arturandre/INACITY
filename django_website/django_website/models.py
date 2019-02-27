from django_website.Primitives.GeoSampa import GeoSampa_BusStops
from django.db import models
from django.contrib.auth.models import User
import uuid

class GeoImage(models.Model):
    """
    featureReference - Some unique string used as an Id
    imageURL - Some path to the actual urban image
    parametersJSON - Custom field for general purposes
    """
    featureReference = models.CharField(max_length=256, unique=True)
    imageURL = models.CharField(max_length=256)
    parametersJSON = models.TextField()

class FilterResult(models.Model):
    geoImage = models.ForeignKey(GeoImage, on_delete=models.CASCADE)
    mask = models.CharField(max_length=256)
    density = models.FloatField()
    presence = models.BooleanField()

class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    sessionName = models.CharField(max_length=256, unique=False)
    uimodelJSON = models.TextField()