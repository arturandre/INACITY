from django.urls import path

from .views import *

urlpatterns = [
    path('link_browser/<str:browser_session>/', link_browser, name='link_browser'),
]