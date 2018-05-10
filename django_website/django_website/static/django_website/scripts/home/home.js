/*Global variables*/

var openLayersHandler = null;
var vectorLayer = null;
var vectorSource = null;
var drawInteraction = null;
var onstreetsconsolidation = function () { console.log('Streets consolidated, check at usersection.allstreets.'); }

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

function getNewId() {
    return _localIDGenerator++;
}


/*User-section variables*/
var usersection = {}
usersection.regions = [];
usersection.allstreets = [];

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

function getGeographicalData(geoDataType, event) {
    var urlGeographicObject = "";


    switch (geoDataType) {
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

    $.each(usersection.regions, function (index, region) {
        if (!region.active) return;

        var geoJsonFeatures = geoJsonFormatter.writeFeature(vectorSource.getFeatureById(region.id), { 'featureProjection': 'EPSG:3857' });
        $.post(
            urlGeographicObject,
            { 'jsondata': geoJsonFeatures },
            function (data, textStatus, jqXHR) {

                //StreetDTO JSON Array
                this.Streets = $.parseJSON(data);
                //console.log("Sample of data:", data);
                //console.log("Sample of textStatus:", textStatus);
                //console.log("Sample of jqXHR:", jqXHR);

                //Do job in background with workers if possible
                if (window.Worker) {
                    let mWorker = new Worker('/static/django_website/scripts/home/worker.js');
                    mWorker.onmessage = function (e) {
                        //e.data = collapseStreetsFromRegionsList(regionsWithStreets) -> [only streets]
                        this.allstreets = e.data; //Shallow copy (not reference)
                        if (onstreetsconsolidated)
                            onstreetsconsolidated();
                    }.bind(usersection);
                    mWorker.postMessage(usersection.regions);
                }
                else //if not then do in foreground
                {
                    //Shallow copied to avoid change 'Streets' attribute from 'usersection.regions'
                    usersection.allstreets = collapseStreetsFromRegionsList(regionsWithStreets).slice();
                    if (onstreetsconsolidated)
                        onstreetsconsolidated();
                }
            }.bind(region),
            "json"
            );
    });

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
                    'name': 'Region ' + newId,
                    'active': false
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
    if (refresh) {
        $("#regionsList").empty();
        $.each(usersection.regions, function (index, region) {
            let item = $(document.createElement('a'));
            item.addClass('list-group-item');
            item.addClass('list-group-item-action');
            item.addClass('active-list-item');
            item.append(region.name);
            item.on("click", region, regionListItemClick);
            if (region.active)
                item.addClass('active');
            else
                vectorSource.getFeatureById(region.id).setStyle(null);
            $("#regionsList").append(item);
        });
    }
}

function regionListItemClick(event) {
    let element = $(event.target);
    element.toggleClass("active");
    regionId = event.data.id;
    usersection.regions[regionId].active = !usersection.regions[regionId].active;
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

function getClickedElement(event) {
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