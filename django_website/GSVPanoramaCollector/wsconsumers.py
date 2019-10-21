from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
from django_website.LogGenerator import write_to_log
import redis
from . import wssender


class WSConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.custom_functions = {'browser_register': self.browser_register}

    def browser_register(self):
        registered_browsers = wssender.get_registered_browser_channel_names()

        redisCon = wssender.get_default_redis_connection()
        if registered_browsers is None:
            registered_browsers = self.channel_name
        else:
            registered_browsers.append(self.channel_name)
            registered_browsers = ",".join(registered_browsers)
        return redisCon.set('registered_browsers', registered_browsers)

    def connect(self):
        # https://channels.readthedocs.io/en/latest/tutorial/part_2.html
        self.browser_session = self.scope['url_route']['kwargs']['browser_session']
        async_to_sync(self.channel_layer.group_add)(
            self.browser_session,
            self.channel_name
        )
        self.accept()
        # message = json.dumps({
        #    'message': self.channel_name
        # })
        # self.send(text_data=message)
        # async_to_sync(self.channel_layer.send)(
        #    self.channel_name,
        #    {
        #        "type": "relay_message",
        #        "message": message
        #    },
        # )

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.browser_session,
            self.channel_name
        )

        registered_browsers = wssender.get_registered_browser_channel_names()
        registered_browsers.remove(self.channel_name)
        redisCon = wssender.get_default_redis_connection()
        if len(registered_browsers) == 0:
            redisCon.delete('registered_browsers')
        else:
            registered_browsers = ",".join(registered_browsers)
            redisCon.set('registered_browsers', registered_browsers)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        received_message = json.dumps(text_data_json['message'])
        message_type = text_data_json.get('type')

        #### DEBUG ONLY
        #redisCon = wssender.get_default_redis_connection()
        #redisCon.set('last_received', text_data)
        ####
        # message = json.dumps({
        #    'message': message,
        # })
        if message_type == 'browser_ready':
            self.browser_register()
            message = json.dumps({
                'message': 'Browser registered successfully'
            })
            self.send(text_data=message)
        if message_type == 'fulfill_request':
            request_id = text_data_json['request_id']
            if wssender.fulfill_request(request_id, received_message):
                message = json.dumps({
                    'message': f'Request: {request_id} delivered successfully!'
                })
            else:
                message = json.dumps({
                    'message': f'Error while delivering request {request_id}!'
                })
            self.send(text_data=message)

    def request_message(self, event):
        self.send(text_data=json.dumps(event))
        #self.send(text_data=event["message"])


    def relay_message(self, event):
        self.send(text_data=event["message"])

