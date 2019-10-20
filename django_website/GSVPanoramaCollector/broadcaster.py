from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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