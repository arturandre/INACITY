# Generated by Django 2.0.6 on 2018-10-01 19:46

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('django_website', '0002_auto_20180513_0310'),
    ]

    operations = [
        migrations.CreateModel(
            name='FilterResult',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mask', models.CharField(max_length=256)),
            ],
        ),
        migrations.CreateModel(
            name='GeoImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('featureReference', models.CharField(max_length=256, unique=True)),
                ('imageURL', models.CharField(max_length=256)),
            ],
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('email', models.CharField(max_length=100)),
            ],
        ),
        migrations.AddField(
            model_name='session',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='django_website.User'),
        ),
        migrations.AddField(
            model_name='filterresult',
            name='geoImage',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='django_website.GeoImage'),
        ),
    ]
