from django.contrib.auth.models import User
from django_website.models import Profile
from django.forms import ModelForm

class UserForm(ModelForm):
    class Meta:
        model = User
        fields = (
            'first_name',
            'last_name',
            'email'
            )

class ProfileForm(ModelForm):
    class Meta:
        model = Profile
        fields = (
            'gsv_api_key',
            'use_alternative_gsv_api_key',
            'gsv_url_signing_secret',
            'use_alternative_gsv_signing_secret'
            )