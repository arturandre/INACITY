# Generated by Django 2.0.6 on 2019-02-27 16:31

from django.conf import settings
import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FilterResult',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mask', models.CharField(max_length=256)),
                ('density', models.FloatField()),
                ('presence', models.BooleanField()),
            ],
        ),
        migrations.CreateModel(
            name='GeoImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('featureReference', models.CharField(max_length=256, unique=True)),
                ('imageURL', models.CharField(max_length=256)),
                ('parametersJSON', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='GeoSampa_BusStops',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('address', models.CharField(max_length=150)),
                ('description', models.CharField(max_length=150)),
                ('name', models.CharField(max_length=150)),
                ('mpoint', django.contrib.gis.db.models.fields.PointField(srid=29183)),
            ],
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('sessionName', models.CharField(max_length=256)),
                ('uimodelJSON', models.TextField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='filterresult',
            name='geoImage',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='django_website.GeoImage'),
        ),
    ]
