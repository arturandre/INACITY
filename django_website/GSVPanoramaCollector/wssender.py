from django_website import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import redis
import random
import uuid

def get_default_redis_connection():
        defaultRedisConnection = settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0]
        redisCon = redis.Redis(
            host=defaultRedisConnection[0], #hostname
            port=defaultRedisConnection[1],  #port
            db=0
            )
        return redisCon

def get_registered_browser_channel_names():
    redisCon = get_default_redis_connection()
    registered_browsers = redisCon.get('registered_browsers')
    if registered_browsers is None:
        return None
    else:
        registered_browsers = registered_browsers.decode('ascii')
        registered_browsers = registered_browsers.split(',')
        return registered_browsers


def get_random_browser_channel_name():
    registered_browsers = get_registered_browser_channel_names()
    if registered_browsers is None:
        return None
    else:
        return registered_browsers[
            random.randrange(len(registered_browsers))
            ]

def register_request():
    redisCon = get_default_redis_connection()
    request_id = str(uuid.uuid4())
    redisCon.set(request_id, 'pending')
    return request_id

def fulfill_request(request_id, value):
    redisCon = get_default_redis_connection()
    if redisCon.get(request_id) is None:
        return False
    return redisCon.set(request_id, value)
    
    


def collect_panorama(panoid):
    layer = get_channel_layer()
    browser_channel_name = get_registered_browser_channel_names()[-1]
    #browser_channel_name = get_random_browser_channel_name()
    #if browser_channel_name is None:
    #    return None
    request_id = register_request()
    async_to_sync(layer.send)(
        browser_channel_name,
        {
            'type': 'request_message',
            'request_id': request_id,
            'message': f'func:crawlNodes,{panoid},0'
        }
    )
    return request_id

def broadcast_function(function, *args):
    params = ",".join(args)
    message = f"func:{function},{params}"
    broadcast_message(message)

def broadcast_message(message):
    layer = get_channel_layer()
    async_to_sync(layer.group_send)('default', {
            'type': 'relay_message',
            'message': f'{{"message": "{message}"}}'
        })

def test_message():
    layer = get_channel_layer()
    async_to_sync(layer.group_send)('default', {
            'type': 'relay_message',
            'message': '{"message": "func:crawlNodes,xpto"}'
        })