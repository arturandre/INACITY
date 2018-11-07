from django.contrib.auth.models import User

class UserManager():
    def createUser(self, userData):
        user = User.objects.create_user(userData['username'], userData['email'], userData['password'])
        user.save()