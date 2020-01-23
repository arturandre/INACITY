from django.http import HttpResponse, HttpResponseForbidden
from django.contrib.auth.models import User
from django.utils.translation import gettext
from django_website.models import Quota
from functools import wraps
import datetime


def quota_decorator_factory(check_quota, update_quota, out_of_quota_message=None):
    """
    Creates a decorator to keep track and limit the usage
    of some function 'func'.

    Depends on two functions, one to define the quota limit
    and one to update this quota. Both functions receive
    as parameter the name of the function 'func'.

    The parameter 'out_of_quota_message' will be printed,
    as the message of a raised Exception, when a call to
    the check_quota function results in a value lower
    than or equal to zero. The default value for this
    parameter is gettext("Out of quota").

    

    Usage:
      from quota import quota_factory
      @quota_factory(check_quota, update_quota)

    Parameters
    ----------
    check_quota : A function that receives as input the
    name of the decorated function and returns a numeric
    value. If the result is lower than or equal to zero
    then an Exception is raised with the out_of_quota_message
    message.

    update_quota : A function that receives as input the
    name of the decorated function and updates the quota
    according to some criterion. The return is discarded.

    out_of_quota_message : Message to be printed as part
    of the raised Exception when check_quota has a
    value lower than or equal to zero. By default this
    message is the translation (provided by the
    gettext function) of the string "Out of quota".

    Returns
    -------
    A decorator instance
    """
    if out_of_quota_message is None:
        out_of_quota_message = gettext("Out of quota")
    def quota_decorator(func):
        @wraps(func)
        def wrapper_func(*args, **kwargs):
            if check_quota(func.__name__) > 0:
                update_quota(func.__name__)
                return func(*args, **kwargs)
            else:
                raise Exception(out_of_quota_message)
        return wrapper_func
    return quota_decorator

def quota_request_decorator_factory(
    default_user_quota,
    default_anonymous_quota,
    skip_condition=None
    ):
    def quota_request_decorator(func):
        @wraps(func)
        def inner(request, *args, **kwargs):
            if skip_condition is not None:
                if skip_condition(request):
                    return func(request, *args, **kwargs)
            if request.user.is_authenticated:
                quota_manager = QuotaManager(request, default_user_quota)
            else:
                quota_manager = QuotaManager(request, default_anonymous_quota)
            if quota_manager.check_quota(func.__name__) > 0:
                quota_manager.update_quota(func.__name__)
                return func(request, *args, **kwargs)
            else:
                #raise Exception('out_of_quota_message')
                return HttpResponseForbidden('out_of_quota_message')
        return inner
    return quota_request_decorator
    



class QuotaManager(object):
    def __init__(self, request, default_quota=-1):
        self.default_quota = default_quota
        if request.user.is_authenticated:
            self.user_or_session = request.user
        else:
            self.user_or_session = request.session.model.objects.get()

    def check_quota(self, function_name):
        try:
            quota_object = self.user_or_session.quota_set.get(function_name=function_name)
        #except self.user_or_session.quota.DoesNotExist:
        except Quota.DoesNotExist:
            self.user_or_session.quota_set.create(
                function_name=function_name,
                quota_available=self.default_quota,
                last_update=datetime.date.today()
                )
            return self.default_quota
        return quota_object.quota_available

    def update_quota(self, function_name):
        quota_object = self.user_or_session.quota_set.get(function_name=function_name)
        quota_object.quota_available -= 1
        quota_object.save()
            