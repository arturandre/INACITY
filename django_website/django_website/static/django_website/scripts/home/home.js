/*Global variables*/

var openLayersHandler = null;
var regionVectorLayer = null;
var regionVectorSource = null;
var streetVectorLayer = null;
var streetVectorSource = null;
var drawInteraction = null;
var usersection = null;
var availableMapMiners = [];

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

function getNewId() {
    return _localIDGenerator++;
}



/********************TESTING*************************/
var mytestjson = undefined;
function callTest() {
    let geoJsonFC = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "capacity": "10",
                "type": "U-Rack",
                "mount": "Surface"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-46.731261, -23.560239]
            }
        }]
    };

    $.ajax({
        dataType: "json",
        url: "/getimagesforfeaturecollection/",
        data: {
            "imageMinerName": "Google Street View",
            "featureCollection": JSON.stringify(geoJsonFC),
        },
        success: function (data, textStatus, jqXHR) {
            mytestjson = data;
            console.log(data);
            console.log(textStatus);
            console.log(jqXHR);

        }});
}

/*********************************************/


$(document).ready(function () {
    /* OpenLayers init */
    openLayersHandler = new OpenLayersHandler('map', 'osm_tiles');

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

    /*OpenLayers Event Handlers*/
    regionVectorSource.on('addfeature', updateRegionsList, regionVectorSource);
    regionVectorSource.on('removefeature', updateRegionsList, regionVectorSource);
    regionVectorSource.on('changefeature', updateRegionsList, regionVectorSource);

    /* UserSection init*/
    usersection = new UserSection('regionsList');

    /*UserSection Event Handlers*/
    //usersection.onstreetsconsolidated = function () { drawStreets(this.streets); };
    usersection.onregionlistitemclick = function (region) {
        regionVectorSource.getFeatureById(region.id).setStyle(region.active ? selectedRegionStyle : null);
    };

    /* Fields population */
    $.get(
            "/getavailablemapminers/",
            null,
            function (data, textStatus, jqXHR) {
                availableMapMiners = data;
                setAvailableMapMinersAndFeatures();
            },
            "json"
            );


    //Default selections:
    /*
    * Tiles provider - OpenStreetMap
    * Focus mode - Image mode
    */
    $('#btnOSMMapsTiles').addClass('disabled');
    $('#btnImageMode').addClass('disabled');
});

/* UI Functions */

var UIState = {}
UIState.SelectedMapMiner = null;
UIState.SelectedMapFeature = null;

function executeQuery(event) {
    //TODO: Create some animation/panel to display the request progress
    let btnExecuteQuery = getClickedElement(event);


    //TODO: Should this call part be here or in a more specific place? (like a class for Ajax handling?)
    let olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });

    let noSelectedRegions = true;

    for (let regionIdx in usersection.regions) {
        let region = usersection.getRegionById(regionIdx);

        if (!region.active) continue;

        noSelectedRegions = false;

        if (UIState.SelectedMapMiner === null) {
            alert("Please, select a Map Miner to continue.");
            return;
        }
        if (UIState.SelectedMapMiner === null) {
            alert("Please, select a Feature to continue.");
            return;
        }

        /* To avoid race conditions during the ajax call */
        let selectedMapMiner = UIState.SelectedMapMiner;
        let selectedMapFeature = UIState.SelectedMapFeature;


        let geoJsonFeatures = olGeoJson.writeFeaturesObject([regionVectorSource.getFeatureById(region.id)]);

        geoJsonFeatures.crs = {
            "type": "name",
            "properties": {
                "name": "EPSG:4326"
            }
        };

        let that = this; /* window */
        $.get
            (
            "/getmapminerfeatures/",
            {
                "mapMinerName": selectedMapMiner,
                "featureName": selectedMapFeature,
                "regions": JSON.stringify(geoJsonFeatures),
            },
            function (data, textStatus, jqXHR) {
                let layerId = selectedMapMiner + "_" + selectedMapFeature;
                let layer = this.getLayerById(layerId);
                if (!layer) {
                    layer = this.createLayer(layerId);
                }

                //Update only if the region now has more features than before
                if (!layer.featureCollection || layer.featureCollection.features.length < data.features.length) {
                    layer.featureCollection = data;
                }

                that.drawLayer(layer); /* window */
            }.bind(region)
            ,
            "json"
            );
    }

    if (noSelectedRegions) {
        alert("No region selected. Please, select a region to make a request.")
    }
}

function clearSelections(event) {
    let btnClearSelections = getClickedElement(event);
    btnClearSelections.addClass("hidden");
    $(`#btnExecuteQuery`).addClass("hidden");

    let mapMinerBtn = $(`#mapMinerBtn`);
    let mapFeatureBtn = $(`#mapFeatureBtn`);
    mapMinerBtn.html("Map Miner");
    mapFeatureBtn.html("Feature");
    mapMinerBtn.addClass("btn-secondary");
    mapFeatureBtn.addClass("btn-secondary");
    mapMinerBtn.removeClass("btn-success");
    mapFeatureBtn.removeClass("btn-success");



    UIState.SelectedMapMiner = null;
    UIState.SelectedMapFeature = null;
    setAvailableMapMinersAndFeatures();
}

function selectMapMiner(event) {
    let mapMinerDiv = $(`#mapMinerDiv`);
    let mapMinerBtn = $(`#mapMinerBtn`);
    $(`#btnClearSelections`).removeClass("hidden");
    $(`#btnExecuteQuery`).removeClass("hidden");
    mapMinerBtn.addClass("btn-success");
    mapMinerBtn.removeClass("btn-secondary");



    let mapMinerName = event.data;



    UIState.SelectedMapMiner = mapMinerName;
    mapMinerBtn.html(mapMinerName);

    setFeaturesFromMapMiner(mapMinerName, true);
}

function selectMapFeature(event) {
    let mapFeatureDiv = $(`#mapFeatureDiv`);
    let mapFeatureBtn = $(`#mapFeatureBtn`);
    $(`#btnClearSelections`).removeClass("hidden");
    $(`#btnExecuteQuery`).removeClass("hidden");

    mapFeatureBtn.addClass("btn-success");
    mapFeatureBtn.removeClass("btn-secondary");


    let mapFeatureName = event.data;

    UIState.SelectedMapFeature = mapFeatureName;
    mapFeatureBtn.html(mapFeatureName);
    setMinersFromFeatures(mapFeatureName, true);
}

function setMinersFromFeatures(FeatureName) {
    let mapMinerDiv = $(`#mapMinerDiv`);
    mapMinerDiv.empty();
    for (let mapMinerName in availableMapMiners) {
        if (availableMapMiners[mapMinerName].indexOf(FeatureName) != -1) {
            let mapMiner = $(document.createElement('a'));
            mapMiner.addClass('dropdown-item');
            mapMiner.append(mapMinerName);
            mapMiner.click(mapMinerName, this.selectMapMiner.bind(this));
            mapMiner.attr("href", "javascript:void(0);");
            mapMinerDiv.append(mapMiner);
        }
    }
}

function setFeaturesFromMapMiner(MapMinerName, clearFeatures) {
    //TODO: Remove this way of define default value without warnings
    if (typeof (clearFeatures) === "undefined") clearFeatures = false;

    let mapFeatureDiv = $(`#mapFeatureDiv`);
    if (clearFeatures) mapFeatureDiv.empty();

    for (let featureIdx in availableMapMiners[MapMinerName]) {
        let feature = availableMapMiners[MapMinerName][featureIdx];
        let mapFeature = $(document.createElement('a'));
        mapFeature.addClass('dropdown-item');
        mapFeature.append(feature);
        mapFeature.click(feature, this.selectMapFeature.bind(this));
        mapFeature.attr("href", "javascript:void(0);");
        mapFeatureDiv.append(mapFeature);
    }
}

function setAvailableMapMinersAndFeatures() {
    let mapMinerDiv = $(`#mapMinerDiv`);
    let mapFeatureDiv = $(`#mapFeatureDiv`);
    mapMinerDiv.empty();
    mapFeatureDiv.empty();
    for (let mapMinerName in availableMapMiners) {
        let mapMiner = $(document.createElement('a'));
        mapMiner.addClass('dropdown-item');
        mapMiner.append(mapMinerName);
        mapMiner.click(mapMinerName, this.selectMapMiner.bind(this));
        mapMiner.attr("href", "javascript:void(0);");
        mapMinerDiv.append(mapMiner);
        setFeaturesFromMapMiner(mapMinerName, false);
    }

}

function drawLayer(layer) {
    if (!layer) { console.warn("Undefined layer!"); return; }
    let featureCollection = layer.featureCollection;
    let olGeoJson = new ol.format.GeoJSON({ featureProjection: featureCollection.crs.properties.name });

    for (let featureIdx in featureCollection.features) {
        let feature = featureCollection.features[featureIdx];
        if (usersection.featuresByLayerIndex[layer.id][feature.id].drawed) continue;
        else {
            let olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
            regionVectorSource.addFeature(olFeature);
            usersection.featuresByLayerIndex[layer.id][feature.id].drawed = true;
        }

    }
}

function removeLayer(layer) {
    if (!layer) { console.warn("Undefined layer!"); return; }
    let featureCollection = layer.featureCollection;

    for (let featureIdx in featureCollection.features) {
        let feature = featureCollection.features[featureIdx];
        if (!usersection.featuresByLayerIndex[layer.id][feature.id].drawed || usersection.isFeatureActive(layer.id, feature.id)) continue;
        else {
            let olFeature = regionVectorSource.getFeatureById(feature.id);
            regionVectorSource.removeFeature(olFeature);
            usersection.featuresByLayerIndex[layer.id][feature.id].drawed = false;
        }

    }
}

function disableSiblings(element) {
    element.siblings().each(function (it, val) {
        $('#' + val.id).removeClass('disabled');
    });
    element.addClass('disabled');
}

function updateRegionsList(vectorevent) {
    switch (vectorevent.type) {
        case 'addfeature':
            //TODO: Associate features created in the frontend with some tag (e.g. "region")
            if (!vectorevent.feature.getId()) {
                let idNumber = getNewId();
                let regionId = 'region' + idNumber;
                vectorevent.feature.setId(regionId);
                vectorevent.feature.setProperties({ 'type': 'region' });
                let newRegion = usersection.createRegion(regionId, `Region ${idNumber}`, false);
                newRegion.onactivechange = function (region) {
                    /*
                    *  TODO:
                    *  Create a panel/mechanism to:
                    *  - Draw a single layer from a single region,
                    *  - Draw multiple layers with the same id present in different regions
                    */
                    if (region.active) {
                        for (let layerIdx in region.layers) {
                            let layer = region.layers[layerIdx];
                            //drawLayer@home.js
                            drawLayer(layer);
                        }
                    }
                    else {
                        for (let layerIdx in region.layers) {
                            let layer = region.layers[layerIdx];
                            //removeLayer@home.js
                            removeLayer(layer);
                        }
                    }
                }
            }
            break;
        case 'removefeature':
            if (vectorevent.feature.getProperties()['type'] === 'region') {
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
function getClickedElement(event) {
    if (!event.srcElement && !event.id) return;
    let elem_id = event.srcElement || event.id;
    let element = $('#' + elem_id);
    return element;
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
        source: regionVectorSource,
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

