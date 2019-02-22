import os
from django.conf import settings

def write_to_log(message):
    f=open(os.path.join(settings.BASE_DIR, "messages.log"), "a+")
    f.write(message + '\n')
