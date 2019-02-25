#!/usr/bin/env python
"""
Command-line utility for administrative tasks.
"""

import os
import sys
import ptvsd


if __name__ == "__main__":
    os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE",
        "django_website.settings"
    )

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)

    try:
        address = ('0.0.0.0', 3000)
        ptvsd.enable_attach(address)
    except:
        pass

