importScripts('/static/django_website/scripts/home/backgroundFunctions.js');

onmessage = function (e)
{
    //collapseStreetsFromRegionsList(regionsWithStreets)
    //e.data should be an Array of regions each of which should have a 'Streets' attribute
    postMessage(collapseStreetsFromRegionsList(e.data))
}