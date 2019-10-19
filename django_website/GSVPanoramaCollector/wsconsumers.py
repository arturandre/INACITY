from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
from django_website.LogGenerator import write_to_log

class WSConsumer(WebsocketConsumer):
    def connect(self):
        #https://channels.readthedocs.io/en/latest/tutorial/part_2.html
        self.browser_session = self.scope['url_route']['kwargs']['browser_session']
        async_to_sync(self.channel_layer.group_add)(
            self.browser_session,
            self.channel_name
        )
        self.accept()
        message = json.dumps({
            'message': self.channel_name
        })
        self.send(text_data=message)
        #async_to_sync(self.channel_layer.send)(
        #    self.channel_name,
        #    {
        #        "type": "relay_message",
        #        "message": message
        #    },
        #)

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.browser_session,
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        message = json.dumps({
            'message': message,
        })

        self.send(text_data=message)

        async_to_sync(self.channel_layer.group_send)(
            self.browser_session,
            {
                "type": "relay_message",
                "message": message
            },
        )

    def relay_message(self, event):
        self.send(text_data=event["message"])