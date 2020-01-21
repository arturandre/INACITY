from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

from django.urls import re_path
from . import wsconsumers

websocket_urlpatterns = [
    re_path(r'ws/GSVPanoramaCollector/(?P<browser_session>\w+)/$', wsconsumers.WSConsumer),
    #re_path(r'(?P<browser_session>\w+)/$', wsconsumers.WSConsumer),
]

application = ProtocolTypeRouter({
    'websocket': URLRouter(websocket_urlpatterns)
})