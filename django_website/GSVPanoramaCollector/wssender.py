from django_website import settings
from django_website.LogGenerator import write_to_log
import subprocess
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import redis
import random
import uuid
import threading
import time


# http://code.activestate.com/recipes/576684-simple-threading-decorator/
# https://stackoverflow.com/questions/5929107/decorators-with-parameters
def run_async(daemon=True):
    """
        run_async(daemon=True)
            function decorator, intended to make "func" run in a separate
            thread (asynchronously). daemon is True by default so if
            every non-daemon thread exits by default this thread will
            be terminated.
            Returns the created Thread object

            E.g.:
            @run_async
            def task1():
                do_something

            @run_async
            def task2():
                do_something_too

            t1 = task1()
            t2 = task2()
            ...
            t1.join()
            t2.join()
    """
    from threading import Thread
    from functools import wraps

    def wrap(func):
        #https://stackoverflow.com/questions/308999/what-does-functools-wraps-do
        #The consequence is that async_func appears as having the same name,
        # docstring, module name, and signature than func
        @wraps(func)
        def async_func(*args, **kwargs):
            func_thread = Thread(target=func, args=args, kwargs=kwargs)
            func_thread.daemon = daemon
            func_thread.start()
            return func_thread

        return async_func
    return wrap


def get_default_redis_connection():
    defaultRedisConnection = settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0]
    redisCon = redis.Redis(
        host=defaultRedisConnection[0],  # hostname
        port=defaultRedisConnection[1],  # port
        db=0
    )
    return redisCon

def send_to_default_channel_layer(channel_name, message, message_type, request_id=None):
    layer = get_channel_layer()

    objMessage = {}
    objMessage['message'] = message
    objMessage['type'] = message_type
    if request_id is not None:
        objMessage['request_id'] = request_id
    
    async_to_sync(layer.send)(
        channel_name,
        objMessage
    )

def send_request_message(channel_name, message, request_id):
    send_to_default_channel_layer(channel_name,
            message=message,
            message_type='request_message',
            request_id=request_id        
            )

@run_async(True)
def watch_requests(request_ids, handler, remove_redis_key=False, timeout_sec=-1, timeout_handler=None):
    redisCon = get_default_redis_connection()
    start_time = time.time()
    while len(request_ids) > 0:
        if timeout_sec > 0:
            elapsed_time = time.time() - start_time
            if elapsed_time > timeout_sec:
                if timeout_handler is not None:
                    timeout_handler(request_ids)
                return
                #return False
        for i in range(len(request_ids)):
            request_id = request_ids[i]
            request_i = redisCon.get(request_id)
            if request_i != b'pending':
                handler(request_id, request_i)
                if remove_redis_key:
                    redisCon.delete(request_id)
                request_ids.remove(request_id)
                break
    return
    #return True

def clear_inactive_browsers():
    redisCon = get_default_redis_connection()
    
    browser_channels = redisCon.get('registered_browsers')
    if browser_channels is None:
        return None
    else:
        browser_channels = browser_channels.decode('ascii')
        browser_channels = browser_channels.split(',')

    def handler(redis_key, redis_val):
        pass
    def timeout_handler(pending_request_ids):
        for pending_req_id in pending_request_ids:

            # Since channel_names are generated
            # based on string.ascii_letters then
            # split over the underscore character is safe
            # https://github.com/django/channels/blob/d22b7206f30a89781203a806bb77af128df07a92/channels/consumer.py#L46
            # https://github.com/django/channels/blob/d22b7206f30a89781203a806bb77af128df07a92/channels/layers.py#L266
            channel_name = pending_req_id.split('_')[0]
            browser_channels.remove(channel_name)
            if len(browser_channels) == 0:
                redisCon.delete('registered_browsers')
            else:
                registered_browsers = ",".join(browser_channels)
                redisCon.set('registered_browsers', registered_browsers)
                    
        pass
    
    if browser_channels is None:
        return
    request_ids = []
    for browser_channel in browser_channels:
        request_id = register_request(browser_channel)
        request_ids.append(request_id)
        send_request_message(browser_channel,
        message=f'func:checkAlive',
        request_id=request_id        
        )
    watch_requests(
        request_ids=request_ids,
        handler=handler,
        remove_redis_key=True,
        timeout_sec=1,
        timeout_handler=timeout_handler).join()
    
    


def get_registered_browser_channel_names(num_tries=0):
    redisCon = get_default_redis_connection()
    clear_inactive_browsers()
    registered_browsers = redisCon.get('registered_browsers')
    if registered_browsers is None:
        # Try to launch a headless browser
        # using the script at "scripts/launch_headless_chrome.sh"
        # Besides launching the script also opens the default
        # page http://localhost/gsvpanoramacollector/link_browser/default/
        # where the browser is registered as available for Redis.
        if num_tries > 0:
            try:
                subprocess.check_call('scripts/launch_headless_chrome.sh')
                write_to_log("(Re)launching headless chrome:\n")
                # sleep for 1 second to wait for the browser to load
                time.sleep(5)
                return get_registered_browser_channel_names(num_tries-1)
            except subprocess.CalledProcessError as error:
                write_to_log("Error while (re)launching headless chrome:\n")
                write_to_log(f"err_code: {error.returncode}\n")
                write_to_log(f"cmd: {error.cmd}\n")
                write_to_log(f"output: {error.stdout}\n")
                write_to_log(f"err_output: {error.stderr}\n")
            finally:
                return None
        else:
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


def register_request(channel_name):
    redisCon = get_default_redis_connection()
    request_id = channel_name + '_' + str(uuid.uuid4())
    redisCon.set(request_id, 'pending')
    return request_id


def fulfill_request(request_id, value):
    redisCon = get_default_redis_connection()
    if redisCon.get(request_id) is None:
        return False
    return redisCon.set(request_id, value)


def collect_panorama(panoid):
    #browser_channel_name = get_registered_browser_channel_names()[-1]
    browser_channel_name = get_random_browser_channel_name()
    if browser_channel_name is None:
        return None
    request_id = register_request(browser_channel_name)
    send_request_message(
        browser_channel_name,
        f'func:crawlNodes,{panoid},0',
        request_id
        )
    return request_id

def collect_panorama_by_location(longLatCoordinates, max_radius=10):
    #browser_channel_name = get_registered_browser_channel_names()[-1]
    browser_channel_name = get_random_browser_channel_name()
    if browser_channel_name is None:
        return None
    request_id = register_request(browser_channel_name)
    send_request_message(
        browser_channel_name,
        f'func:getPanoramaByLocation,{longLatCoordinates},{max_radius}',
        request_id
        )
    return request_id


# def broadcast_function(function, *args):
#     params = ",".join(args)
#     message = f"func:{function},{params}"
#     broadcast_message(message)


# def broadcast_message(message):
#     layer = get_channel_layer()
#     async_to_sync(layer.group_send)('default', {
#         'type': 'relay_message',
#         'message': f'{{"message": "{message}"}}'
#     })


# def test_message():
#     layer = get_channel_layer()
#     async_to_sync(layer.group_send)('default', {
#         'type': 'relay_message',
#         'message': '{"message": "func:crawlNodes,xpto"}'
#     })
