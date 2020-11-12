from django_website import settings, settings_secret
from django.shortcuts import render
from django.utils.safestring import mark_safe
import json

# Create your views here.
def link_browser(request, browser_session, daphneport=settings.DAPHNE_PORT):
    return render(request, 'link_browser.html', {
        'public_gsv_key' : settings_secret.GSV_KEY,
        'browser_session_json': mark_safe(json.dumps(browser_session)),
        'daphne_port_json': mark_safe(json.dumps(daphneport))
    })
