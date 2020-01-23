from django.contrib.auth.models import User
from django_website.models import Profile
from django.forms import ModelForm
from django import forms

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
        gsv_api_key = forms.CharField(
            widget=forms.PasswordInput)
        gsv_url_signing_secret = forms.CharField(
            widget=forms.PasswordInput)
        fields = (
            'gsv_api_key',
            'use_alternative_gsv_api_key',
            'gsv_url_signing_secret',
            'use_alternative_gsv_signing_secret'
            )
        widgets = {
            'gsv_api_key': forms.PasswordInput(attrs={
                'autocomplete': 'off',
            },render_value=True),
            'gsv_url_signing_secret': forms.PasswordInput(attrs={
                'autocomplete': 'off',
            },render_value=True),
        }
    def clean(self):
        cd = self.cleaned_data
        if cd.get('use_alternative_gsv_api_key')\
            and not (cd.get('gsv_api_key').strip()):
            self.add_error('gsv_api_key', (
                'Using an alternative Google Street View API key is checked, '
                'but no API key was provided.\n'
                'If the remotion of the key is intended then uncheck '
                'the box \'Use this Google Street View API key by default?\''
                ))
        if cd.get('use_alternative_gsv_signing_secret')\
            and not (cd.get('gsv_url_signing_secret').strip()):
            self.add_error('gsv_url_signing_secret', (
                'Using an alternative Google Street View '
                'URL signing key is checked, '
                'but no url signing key was provided.'
                'If the remotion of the key is intended then uncheck '
                'the box \'Use this Google Street View signing secret by default?\''
                ))
        if cd.get('use_alternative_gsv_signing_secret')\
            and not (cd.get('use_alternative_gsv_api_key')):
            self.add_error('gsv_url_signing_secret', (
                'Using an alternative Google Street View '
                'URL signing key is checked, '
                'but an alternative Google Street View API key is not checked.\n'
                'To use a signing key the corresponding API key must be '
                'provided.'
                ))

                