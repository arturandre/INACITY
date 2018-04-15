#from django.template.loader import get_template
#from django.http import HttpResponse
from django.shortcuts import render
from django.http import Http404, HttpResponse
import datetime

def merge_two_dicts(x, y):
    """Given two dicts, merge them into a new dict as a shallow copy."""
    z = x.copy()
    z.update(y)
    return z

TEMPLATE_GLOBAL_VARS = {'WebsiteName': 'INACITY'}

def hello(request):
    return HttpResponse("Hello world")

def home(request):
    now = datetime.datetime.now()

    htmlfile = 'home.html'
    local_vars = {'sample_key': 'sample_data'}
    return render(request, htmlfile, merge_two_dicts(TEMPLATE_GLOBAL_VARS, local_vars))

def hours_ahead(request, hour_offset):
    global TEMPLATE_GLOBAL_VARS
    try:
        hour_offset = int(hour_offset)
    except ValueError:
        raise Http404()
    next_time = datetime.datetime.now() + datetime.timedelta(hours=hour_offset)

    htmlfile = 'hours_ahead.html'
    local_vars = {'hour_offset': hour_offset, 'next_time': next_time}
    return render(request, htmlfile, merge_two_dicts(TEMPLATE_GLOBAL_VARS, local_vars))