import os
from django.conf import settings

def write_to_log(message):
    """
    Convenience function used to debug the
    code. It writes to the local file 'messages.log'.

    Parameters
    ----------

    message : str
        The text to be inserted in the file 'messages.log'

    Returns
    -------
    none
    """

    message = str(message).encode('utf-8')
    #f=open(os.path.join(settings.BASE_DIR, "messages.log"), "a+")
    f=open(settings.MESSAGE_LOG_FILEPATH, "a+")
    f.writelines(str(message) + '\n')
