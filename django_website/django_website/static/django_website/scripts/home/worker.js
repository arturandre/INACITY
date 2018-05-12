importScripts('/static/django_website/scripts/home/backgroundFunctions.js');

onmessage = function (e)
{
    //collapseStreetsFromRegionsList(regionsWithStreets, previousCollapsedList = {})
    //e.data[0] should be an Array of regions each of which should have a 'Streets' attribute
    //e.data[1] should be an Array of streets that were filled by the collapseStreetsFromRegionsList function
    postMessage(collapseStreetsFromRegionsList(e.data[0], e.data[1]));
    close();
}