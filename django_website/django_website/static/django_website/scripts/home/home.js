/*Global variables*/

var openLayersHandler = null;
var regionVectorLayer = null;
var regionVectorSource = null;
var streetVectorLayer = null;
var streetVectorSource = null;
var drawInteraction = null;
var usersection = null;

/* Settings Region */

var selectedRegionStyle = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.1)' }),
    stroke: new ol.style.Stroke({
        color: '#ff0000',
        width: 1
    })
});

var transparentStyle = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0,0,0,0.0)' }),
    stroke: new ol.style.Stroke({
        color: 'rgba(0,0,0,0.0)',
        width: 1
    })
});


/*Auxiliar functions*/
//Don't use this directly! For new identifiers use getNewId()
var _localIDGenerator = 0;

function getNewId()
{
    return _localIDGenerator++;
}






$(document).ready(function ()
{
    openLayersHandler = new OpenLayersHandler('map', 'osm_tiles');
    usersection = new UserSection('regionsList');
    regionVectorSource = new ol.source.Vector({ wrapX: false });
    regionVectorLayer = new ol.layer.Vector({
        source: regionVectorSource
    });
    regionVectorLayer.setMap(openLayersHandler.map);

    streetVectorSource = new ol.source.Vector({ wrapX: false });
    streetVectorLayer = new ol.layer.Vector({
        source: streetVectorSource
    });
    streetVectorLayer.setMap(openLayersHandler.map);

    /*Event Handlers*/
    regionVectorSource.on('addfeature', updateRegionsList, regionVectorSource);
    regionVectorSource.on('removefeature', updateRegionsList, regionVectorSource);
    regionVectorSource.on('changefeature', updateRegionsList, regionVectorSource);
    usersection.onstreetsconsolidated = function () { drawStreets(this.streets); };
    usersection.onregionlistitemclick = function (region)
    {
        regionVectorSource.getFeatureById(region.id).setStyle(region.active ? selectedRegionStyle : null);
        drawStreets(this.streets);
    };


    //Default selections:
    /*
    * Tiles provider - OpenStreetMap
    * Focus mode - Image mode
    */
    $('#btnOSMMapsTiles').addClass('disabled');
    $('#btnImageMode').addClass('disabled');
});

function getGeographicalData(geoDataType, event)
{
    var urlGeographicObject = "";


    switch (geoDataType)
    {
        case 'Streets':
            urlGeographicObject = "/getstreets/";
            break;
        case 'Bus Stops':

            break;
        case 'Pharmacies':
            break;
        case 'Schools':
            break;
        default:
            console.error("Unlisted geoDataType!");
            break;

    }

    var geoJsonFormatter = new ol.format.GeoJSON()
    //TODO: Should this call part be here or in a more specific place? (like a class for Ajax handling?)
    for (let regionIdx in usersection.getRegions())
    {
        let region = usersection.getRegionById(regionIdx);
        if (!region.active) continue;

        var geoJsonFeatures = geoJsonFormatter.writeFeature(regionVectorSource.getFeatureById(region.id), { 'featureProjection': 'EPSG:3857' });
        $.post(
            urlGeographicObject,
            { 'geojsondata': geoJsonFeatures },
            function (data, textStatus, jqXHR)
            {
                region.Streets = $.parseJSON(data);
                this.consolidateStreets(); /*usersection*/
            }.bind(usersection),
            "json"
            );
    }

}



function drawStreets(ConsolidatedStreets)
    /* ConsolidatedStreets have the 'regions' property indicating to which regions a street belongs */
{
    for (let cstreetIdx in ConsolidatedStreets)
    {
        let cstreet = ConsolidatedStreets[cstreetIdx];

        /* Check if cstreet belongs to any active region */
        cstreetActive = false;
        for (let regionIdx in cstreet.regions)
        {
            if (usersection.getRegionById(cstreet.regions[regionIdx]).active)
            {
                cstreetActive = true;
                break;
            }
        }

        /*
        *  By default streets (FeatureCollections of MultiLineStrings) doesn't come with IDs from the server,
        *  so it's important to add an "id" property to facilitate to reference during drawing/erasing tasks.
        */
        if (!cstreet.street.id)
        {
            /* OpenLayers Features are different from GeoJson in that it has methods used by OpenLayers */
            let olGeoJson = new ol.format.GeoJSON({ featureProjection: usersection.regions[cstreet.regions[0]].Streets.crs.properties.name });
            cstreet.street.id = getNewId();
            let olFeature = olGeoJson.readFeature(cstreet.street);
            streetVectorSource.addFeature(olFeature);
        }
        else
        {
            if (cstreetActive && !cstreet.street.drawed)
            {
                let cFeature = streetVectorSource.getFeatureById(cstreet.street.id);
                cFeature.setStyle(null);
                cstreet.street.drawed = true;
            }
            else if (!cstreetActive && cstreet.street.drawed)
            {
                let cFeature = streetVectorSource.getFeatureById(cstreet.street.id);
                cFeature.setStyle(transparentStyle);
                cstreet.street.drawed = false;
            }
        }


    }
}

function disableSiblings(element)
{
    element.siblings().each(function (it, val)
    {
        $('#' + val.id).removeClass('disabled');
    });
    element.addClass('disabled');
}

function updateRegionsList(vectorevent)
{
    switch (vectorevent.type)
    {
        case 'addfeature':
            let idNumber = getNewId();
            let regionId = 'region' + idNumber;
            vectorevent.feature.setId(regionId);
            vectorevent.feature.setProperties({ 'type': 'region' });
            usersection.createNewRegion(regionId, `Region ${idNumber}`, false);
            break;
        case 'removefeature':
            if (f.getProperties()['type'] === 'region')
            {
                let featureId = vectorevent.getId();
                usersection.removeRegion(featureId);
            }
            break;
        case 'changefeature':
            break;
        default:
            console.error('Unknown event type!');
            break;
    }
    
}

/* Click Event Region*/
function getClickedElement(event)
{
    if (!event.srcElement && !event.id) return;
    let elem_id = event.srcElement || event.id;
    let element = $('#' + elem_id);
    return element;
}

function changeModeClick(mode, event)
{
    if (!btnElementChecker(event)) return;
    switch (mode)
    {
        case 'Map':
            $(".image-div").addClass('hidden');
            $(".region-div").removeClass('hidden');
            break;
        case 'Image':
            $(".region-div").addClass('hidden');
            $(".image-div").removeClass('hidden');
            break;
        default:
            console.error("Unknown mode selected!")
            break;
    }
}

function changeShapeClick(shapeType, event)
{
    if (!btnElementChecker(event)) return;
    openLayersHandler.map.removeInteraction(drawInteraction);
    let value = shapeType;
    var geometryFunction;
    switch (value)
    {
        case 'Square':
            value = 'Circle';
            geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
            break;
        case 'Box':
            value = 'Circle';
            geometryFunction = ol.interaction.Draw.createBox();
            break;
        case 'Dodecagon':
            value = 'Circle';
            geometryFunction = function (coordinates, geometry)
            {
                if (!geometry)
                {
                    geometry = new ol.geom.Polygon(null);
                }
                var center = coordinates[0];
                var last = coordinates[1];
                var dx = center[0] - last[0];
                var dy = center[1] - last[1];
                var radius = Math.sqrt(dx * dx + dy * dy);
                var rotation = Math.atan2(dy, dx);
                var newCoordinates = [];
                var numPoints = 12;
                for (var i = 0; i < numPoints; ++i)
                {
                    var angle = rotation + i * 2 * Math.PI / numPoints;
                    var offsetX = radius * Math.cos(angle);
                    var offsetY = radius * Math.sin(angle);
                    newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
                }
                newCoordinates.push(newCoordinates[0].slice());
                geometry.setCoordinates([newCoordinates]);
                return geometry;
            };
            break;
    }
    drawInteraction = new ol.interaction.Draw({
        source: regionVectorSource,
        type: value,
        geometryFunction: geometryFunction
    });
    openLayersHandler.map.addInteraction(drawInteraction);
}

function changeMapProviderClick(mapProviderId, event)
{
    if (!btnElementChecker(event)) return;
    openLayersHandler.changeMapProvider(mapProviderId);
}

function btnElementChecker(event)
{
    let element = getClickedElement(event);
    if (!element) return;
    if (element.hasClass('disabled')) return;
    disableSiblings(element);
    return element;
}

