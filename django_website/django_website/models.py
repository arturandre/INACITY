from django.contrib.sessions.models import Session as DjangoSession
from django_website.Primitives.GeoSampa import GeoSampa_BusStops
from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils.translation import ugettext_lazy as _

# Ref. https://simpleisbetterthancomplex.com/tutorial/2016/07/22/how-to-extend-django-user-model.html#onetoone
from django.db.models.signals import post_save
from django.dispatch import receiver


# Ref.: https://arthurpemberton.com/2015/04/fixing-uuid-is-not-json-serializable
'''
Dealing with no UUID serialization support in json
'''
from json import JSONEncoder
from uuid import UUID
JSONEncoder_olddefault = JSONEncoder.default
def JSONEncoder_newdefault(self, o):
    if isinstance(o, UUID): return str(o)
    return JSONEncoder_olddefault(self, o)
JSONEncoder.default = JSONEncoder_newdefault

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    gsv_api_key = models.CharField(
        _('Google Street View API key'),
        max_length=39,
        blank=True
        )
    use_alternative_gsv_api_key = models.BooleanField(
        _('Use this Google Street View API key by default?'),
        default=False)
    gsv_url_signing_secret = models.CharField(
        _('Google Street View url signing secret'),
        max_length=28,
        blank=True)
    use_alternative_gsv_signing_secret = models.BooleanField(
        _('Use this Google Street View signing secret by default?'),
        default=False)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
    

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

class Quota(models.Model):
    user = models.ForeignKey(
        User,
        blank=True,
        null=True,
        on_delete=models.CASCADE)
    session = models.ForeignKey(DjangoSession,
        blank=True,
        null=True,
        on_delete=models.CASCADE)
    function_name = models.CharField(max_length=256, unique=False)
    quota_available = models.IntegerField()
    last_update = models.DateField()
