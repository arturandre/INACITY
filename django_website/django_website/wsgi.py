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
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_website.settings")

# This application object is used by any WSGI server configured to use this
# file. This includes Django's development server, if the WSGI_APPLICATION
# setting points here.
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
from django_website.LogGenerator import write_to_log
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
