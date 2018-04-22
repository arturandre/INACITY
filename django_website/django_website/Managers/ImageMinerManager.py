from django_website.ImageMiners.ImageMiner import ImageMiner
from django_website.ImageMiners.GoogleStreetViewMiner import GoogleStreetViewMiner

class ImageMinerManager():
    def testGoogleStreetViewMiner():
        return GoogleStreetViewMiner._GoogleStreetViewMiner__testURL()