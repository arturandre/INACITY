# Generated by Django 2.0.6 on 2020-01-12 02:54

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('django_website', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('gsv_api_key', models.CharField(blank=True, max_length=39, verbose_name='Google Street View API key')),
                ('use_alternative_gsv_api_key', models.BooleanField(default=False, verbose_name='Use this Google Street View API key by default?')),
                ('gsv_url_signing_secret', models.CharField(blank=True, max_length=28, verbose_name='Google Street View url signing secret')),
                ('use_alternative_gsv_signing_secret', models.BooleanField(default=False, verbose_name='Use this Google Street View signing secret by default?')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
