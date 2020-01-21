"""
WSGI config for django_website project.
This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.
Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.
"""
from pathlib import Path
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_website.settings")

# This application object is used by any WSGI server configured to use this
# file. This includes Django's development server, if the WSGI_APPLICATION
# setting points here.
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
from django_website.LogGenerator import write_to_log

# This is needed since the apache mod_wsgi will set the current working
# directory as the root (or the user home) folders. Here the working
# directory will be INACITY root folder (the outermost 'django_website' folder)
path = Path(os.path.dirname(__file__))
os.chdir(path.parent)

write_to_log(f'Working dir: {os.getcwd()}')
print(f'Working dir: {os.getcwd()}')

write_to_log('wsgi loaded')
print('wsgi loaded')



import sys

if 'runserver' in sys.argv:
    import ptvsd
    try:
        address = ('0.0.0.0', 3000)
        ptvsd.enable_attach(address)
        print('ptvsd enabled')
        write_to_log('ptvsd enabled')
    except Exception as  e:
        print(f'ptvsd error: {str(e)}')
        write_to_log(f'ptvsd error: {str(e)}')
        pass

# Apply WSGI middleware here.
# from helloworld.wsgi import HelloWorldApplication
# application = HelloWorldApplication(application)

# Used to check if wsgi is running under daemon or embedded mode:
# def application(environ, start_response):
#     status = '200 OK'

#     if not environ['mod_wsgi.process_group']:
#       output = u'EMBEDDED MODE'
#     else:
#       output = u'DAEMON MODE'

#     response_headers = [('Content-Type', 'text/plain'),
#                         ('Content-Length', str(len(output)))]

#     start_response(status, response_headers)

#     return [output.encode('UTF-8')]