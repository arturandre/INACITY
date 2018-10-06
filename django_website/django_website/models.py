from django_website.Primitives.GeoSampa import GeoSampa_BusStops
from django.db import models
from django.contrib.auth.models import User

class GeoImage(models.Model):
    featureReference = models.CharField(max_length=256, unique=True)
    imageURL = models.CharField(max_length=256)
    parametersJSON = models.TextField

class FilterResult(models.Model):
    geoImage = models.ForeignKey(GeoImage, on_delete=models.CASCADE)
    mask = models.CharField(max_length=256)
    density = models.FloatField
    presence = models.BooleanField

class Session(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    uimodelJSON = models.TextField