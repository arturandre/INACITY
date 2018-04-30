/*Global variables*/

var openLayersHandler = null;
var vectorLayer = null;
var vectorSource = null;
var drawInteraction = null;

/*Settings*/
var selectedRegionStyle = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.1)' }),
    stroke: new ol.style.Stroke({
        color: '#ff0000',
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


/*User-section variables*/
var usersection = {}
usersection.regions = [];

$(document).ready(function () {
    openLayersHandler = new OpenLayersHandler('map', 'osm_tiles');
    vectorSource = new ol.source.Vector({ wrapX: false });
    vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });
    vectorLayer.setMap(openLayersHandler.map);
    
    vectorSource.on('addfeature', updateRegionsList, vectorSource);
    vectorSource.on('removefeature', updateRegionsList, vectorSource);
    vectorSource.on('changefeature', updateRegionsList, vectorSource);

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

}

function updateRegionsList(vectorevent) {
    let refresh = true;
    
    switch (vectorevent.type) {
        case 'addfeature':
            let newId = getNewId();
            vectorevent.feature.setId(newId);
            usersection.regions[newId] =
                {
                    'id': newId,
                    'name': 'Region ' + newId
                };
            break;
        case 'removefeature':
            break;
        case 'changefeature':
            refresh = false;
            break;
        default:
            refresh = false;
            console.error('Unknown event type!');
            break;
    }
    if (refresh){
        $("#regionsList").empty();
        $.each(usersection.regions, function (index, region)
        {
            let item = $(document.createElement('a'));
            item.addClass('list-group-item');
            item.addClass('list-group-item-action');
            item.addClass('active-list-item');
            item.append(region.name);
            item.on("click", region, regionListItemClick);
            vectorSource.getFeatureById(region.id).setStyle(null);
            $("#regionsList").append(item);
        });
    }
}

function regionListItemClick(event) {
    let element = $(event.target);
    element.toggleClass("active");
    regionId = event.data.id;
    vectorSource.getFeatureById(regionId).setStyle(element.hasClass("active") ? selectedRegionStyle : null);
}

function changeModeClick(mode, event) {
    if (!btnElementChecker(event)) return;
    switch (mode) {
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

function changeShapeClick(shapeType, event) {
    if (!btnElementChecker(event)) return;
    openLayersHandler.map.removeInteraction(drawInteraction);
    let value = shapeType;
    var geometryFunction;
    switch (value) {
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
            geometryFunction = function (coordinates, geometry) {
                if (!geometry) {
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
                for (var i = 0; i < numPoints; ++i) {
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
        source: vectorSource,
        type: value,
        geometryFunction: geometryFunction
    });
    openLayersHandler.map.addInteraction(drawInteraction);
}

function changeMapProviderClick(mapProviderId, event) {
    if (!btnElementChecker(event)) return;
    openLayersHandler.changeMapProvider(mapProviderId);
}

function btnElementChecker(event) {
    let element = getClickedElement(event);
    if (!element) return;
    if (element.hasClass('disabled')) return;
    disableSiblings(element);
    return element;
}

function getClickedElement(event)
{
    if (!event.srcElement && !event.id) return;
    let elem_id = event.srcElement || event.id;
    let element = $('#' + elem_id);
    return element;
}

function disableSiblings(element) {
    element.siblings().each(function (it, val) {
        $('#' + val.id).removeClass('disabled');
    });
    element.addClass('disabled');
}