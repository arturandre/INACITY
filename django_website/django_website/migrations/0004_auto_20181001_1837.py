# Generated by Django 2.0.6 on 2018-10-01 21:37

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('django_website', '0003_auto_20181001_1646'),
    ]

    operations = [
        migrations.AlterField(
            model_name='session',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.DeleteModel(
            name='User',
        ),
    ]