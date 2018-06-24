/**
* Responsible for the interaction management at the home page
* @module "home.js"
*/



//#region Global variables

/**
 * Responsible for keeping user selections.
 * @todo Make it a class.
 * @param {string} SelectedMapMiner - Selected map miner's id
 * @param {string} SelectedMapFeature - Selected map features's id
 * @param {string} SelectedImageProvider - Selected image providers' id
 */
var UIState = {}
UIState.SelectedMapMiner = null;
UIState.SelectedMapFeature = null;
UIState.SelectedImageProvider = null;

/** 
* Handler for the OpenLayers object
* @type {OpenLayersHandler}
* @see {@link module:OpenLayersHandler~OpenLayersHandler}
*/
var openLayersHandler = null;

/**
* Used as the global vector layer
* @param {ol.layer.Vector}
* @see [ol.layer.Vector]{@link https://openlayers.org/en/latest/apidoc/ol.layer.Vector.html}
*/
var globalVectorLayer = null;
/**
* Used as the global vector source of the [globalVectorLayer]{@link module:"home.js"~globalVectorLayer}
* @type {ol.layer.Vector}
* @see [ol.layer.Vector]{@link https://openlayers.org/en/latest/apidoc/ol.layer.Vector.html}
*/
var globalVectorSource = null;
/**
* Used as a global auxiliary variable to allow drawing interactions over the map
* @type {ol.interaction.Draw}
* @see [ol.interaction.Draw]{@link https://openlayers.org/en/latest/apidoc/ol.interaction.Draw.html}
*/
var drawInteraction = null;

/**
* Usersection variable used to keep the state of objects collected
* @type {UserSection}
* @see {@link module:UserSection~UserSection}
*/
var usersection = null;

/**
* List of available map miners as informed by the server (e.g. {osm: {features: ..., name: OpenStreetMap}})
* @type {object[]}
*/
var availableMapMiners = [];

/**
* List of available image providers as informed by the server (e.g. Google Street View)
* @type {object[]}
*/
var availableImageMiners = [];

//#endregion Global variables

//#region Styles

/**
 * Style used to mark a select(active) region
 * @const
 * @param {ol.style.Style}
 * @see [ol.style.Style]{@link https://openlayers.org/en/latest/apidoc/ol.style.Style.html}
 */
var selectedRegionStyle = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.1)' }),
    stroke: new ol.style.Stroke({
        color: '#ff0000',
        width: 1
    })
});

/**
 * Auxiliar style to give transparency for OpenLayers' features
 * @const
 * @param {ol.style.Style}
 * @see [ol.style.Style]{@link https://openlayers.org/en/latest/apidoc/ol.style.Style.html}
 */
var transparentStyle = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0,0,0,0.0)' }),
    stroke: new ol.style.Stroke({
        color: 'rgba(0,0,0,0.0)',
        width: 1
    })
});

//#endregion Styles 

//#region Auxiliar functions

/**
 * Used as an auxiliary variable for the [getNewId]{@link module:"home.js"~getNewId} function.
 * Don't use this directly! For new identifiers use [getNewId]{@link module:"home.js"~getNewId} function.
 * @private
 */
var _localIDGenerator = 0;

/**
 * Used to generate an incremental unique id (not randomized!)
 * @returns {number} The incremented (by 1) value of [_localIDGenerator]{@link module:"home.js"~_localIDGenerator}
 */
function getNewId() {
    return _localIDGenerator++;
}

//#endregion Auxiliar functions


//TODO: Rewrite this as a testing unit in the Testing module
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

        }
    });
}

/*********************************************/

/**
 * JQuery ready function used to initialize variables
 */
$(document).ready(function () {
    /* Bootstrap tooltips initializer*/
    $('[data-toggle="tooltip"]').tooltip();

    initializeOpenLayers();

    initializeUserSection();

    getServerParameters();

    setDefaults();
});

//#region Initializer functions

/**
 * Auxiliar function used to initialize OpenLayers related objects and events
 */
function initializeOpenLayers()
{
    /* OpenLayers init */
    openLayersHandler = new OpenLayersHandler('map', 'osm_tiles');

    globalVectorSource = new ol.source.Vector({ wrapX: false });
    globalVectorLayer = new ol.layer.Vector({
        source: globalVectorSource
    });
    globalVectorLayer.setMap(openLayersHandler.map);

    /*OpenLayers Event Handlers*/
    globalVectorSource.on('addfeature', updateRegionsList, globalVectorSource);
    globalVectorSource.on('removefeature', updateRegionsList, globalVectorSource);
    globalVectorSource.on('changefeature', updateRegionsList, globalVectorSource);

}

/**
 * Auxiliar function to initialize UserSection related objects and events
 */
function initializeUserSection()
{
    /* UserSection init*/
    usersection = new UserSection('regionsList');

    /*UserSection Event Handlers*/
    /*onregionlistitemclick - Triggers when an region is [de]/selected ([de]/activated)*/
    UserSection.on('regionlistitemclick', updateLayersHintList);
    UserSection.on('featuresmerged', function (layer){ this.drawLayer(layer, true); }, this); /* this = window */
    
    Layer.on('featurecollectionchange', updateLayersHintList);
    Layer.on('featurecollectionchange', function (layer){ this.drawLayer(layer, true); }, this); /* this = window */
}



/**
 * Auxiliar function to populate field's based on server retrieved parameters
 */
function getServerParameters()
{
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
    $.get(
            "/getavailableimageminers/",
            null,
            function (data, textStatus, jqXHR) {
                availableImageMiners = data;
                setAvailableImageMiners();
            },
            "json"
            );
}

/**
 * Auxiliar function to set default options of the UI.
 */
function setDefaults()
{
    //Default selections:
    /*
    * Tiles provider - OpenStreetMap
    * Focus mode - Image mode
    */
    $('#btnOSMMapsTiles').addClass('disabled');
    $('#btnImageMode').addClass('disabled');
}

//#endregion Initializer functions

//#region Caller functions

function getImages(event)
{
    let btnCollectImages = getClickedElement(event);
    let noLayers = true;

    //To avoid racing conditions
    let selectedImageProvider = UIState.SelectedImageProvider;
    let numCalls = 0;
    try
    {
        setLoadingText(btnCollectImages);
        for (const regionIdx in usersection.regions)
        {
            let region = usersection.regions[regionIdx];
            numCalls += Object.keys(region.layers).length;
            if (numCalls > 0) noLayers = false;
            for (const layerIdx in region.layers)
            {
                let layer = region.layers[layerIdx];
                
                $.ajax('/getimagesforfeaturecollection/',
                {
                    method: 'POST',
                    processData: false,
                    data: JSON.stringify({
                        'imageMinerName': selectedImageProvider,
                        'featureCollection': JSON.stringify(layer.featureCollection),
                        'regionId': regionIdx,
                        'layerId': layerIdx
                    }),
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    context: btnCollectImages[0], //Get the DOM element instead of the Jquery object
                    success: function (data, textStatus, jqXHR) {
                        usersection.regions[data['regionId']].layers[data['layerId']].featureCollection = data['featureCollection'];

                    },
                    error: function ( jqXHR, textStatus, errorThrown) 
                    {
                        defaultAjaxErrorHandler('getImages', textStatus, errorThrown);
                    },
                    complete: function  (jqXHR, textStatus)
                    {
                        numCalls -= 1;
                        if (numCalls == 0)
                        {
                            unsetLoadingText(btnCollectImages);
                        }                    
                    },
                },
                'json'
                );
            }
        }
    }
    catch(err)
    {
        unsetLoadingText(btnCollectImages);
        throw err;
    }
    if (noLayers)
    {
        unsetLoadingText(btnCollectImages);
        alert("None feature selected. Canceled.")
    }
}

function getMapMinerFeatures(region, selectedMapMiner, selectedMapFeature, geoJsonFeatures)
{
    return new Promise(function (resolve){
        let that = this; /* window */
        $.ajax
            (
            "/getmapminerfeatures/",
            {
                method: 'POST',
                data: JSON.stringify({
                    "mapMinerId": selectedMapMiner,
                    "featureName": selectedMapFeature,
                    "regions": JSON.stringify(geoJsonFeatures),
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    //let region = this;
                    //let layerId = selectedMapMiner + "_" + selectedMapFeature;
                    //let layer = region.getLayerById(layerId); 
                    //if (!layer) {
                    //    layer = region.createLayer(layerId);
                    //}

                    //Update only if the layer now has more features than before
                    //if (!layer.featureCollection || layer.featureCollection.features.length < data.features.length) {
                    //}
                    resolve(data);
                }.bind(region),
                error: function ( jqXHR, textStatus, errorThrown) 
                {
                    defaultAjaxErrorHandler('executeQuery', textStatus, errorThrown);
                    reject();
                },
            });
    });
}

//#endregion Caller functions

//#region Auxiliar functions for caller functions

/**
* Auxiliar function to display to the user eventual errors during ajax calls
* @param {string} textStatus - The type of error that occurred and an optional exception object, if one occurred. Possible values for the second argument (besides null) are "timeout", "error", "abort", and "parsererror".
* @param {string} errorThrown - When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
* @see {@link http://api.jquery.com/jquery.ajax/}
*/
function defaultAjaxErrorHandler(locationName, textStatus, errorThrown)
{
    alert(`Error during server at ${locationName}. Status: ${textStatus}. Error message: ${errorThrown} `);
    if (errorThrown)
    {
        throw errorThrown;
    }
}

//#endregion Auxiliar functions for caller functions

//#region UI Functions 

function updateLayersHintList() {
    let hintLayers = [];
    
    //Set active layers list tooltip
    for (const regionId in usersection.regions)
    {
        let region = usersection.regions[regionId];
        globalVectorSource.getFeatureById(region.id).setStyle(region.active ? selectedRegionStyle : null);
        if (region.active)
        {
            for (const layerIdx in region.layers)
            {
                //TODO: Set a better way to name layers than MapMinerName_FeatureName
                setHintLayers(layerIdx);
            }
        }
    }
    refreshHintTitle();


    function setHintLayers(layerId){
        let aux = layerId.split('_');
        let mapMinerName = availableMapMiners[aux[0]].name;
        let featureName = aux[1];
        let hintLayer = `${mapMinerName} - ${featureName}`;
        if (hintLayers.indexOf(hintLayer) < 0)
        {
            hintLayers.push(hintLayer);
        }
    }

    function refreshHintTitle()
    {
        //Get Images Button
        $('#btnCollectImages').attr('data-original-title', "Selected layers are:\n" + hintLayers.join('\n'))
    }
}

function selectMapMiner(mapMinerId) {
    let mapMinerDiv = $(`#mapMinerDiv`);
    let mapMinerBtn = $(`#mapMinerBtn`);
    $(`#btnClearSelections`).removeClass("hidden");
    $(`#btnExecuteQuery`).removeClass("hidden");
    mapMinerBtn.addClass("btn-success");
    mapMinerBtn.removeClass("btn-secondary");

    UIState.SelectedMapMiner = mapMinerId;
    mapMinerBtn.html(availableMapMiners[mapMinerId].name);

    setFeaturesFromMapMiner(availableMapMiners[mapMinerId], true);
}

function selectMapFeature(mapFeatureName) {
    let mapFeatureBtn = $(`#mapFeatureBtn`);
    $(`#btnClearSelections`).removeClass("hidden");
    $(`#btnExecuteQuery`).removeClass("hidden");

    mapFeatureBtn.addClass("btn-success");
    mapFeatureBtn.removeClass("btn-secondary");

    UIState.SelectedMapFeature = mapFeatureName;
    mapFeatureBtn.html(mapFeatureName);
    setMinersFromFeatures(mapFeatureName);
}

function setMinersFromFeatures(FeatureName) {
    let mapMinerDiv = $(`#mapMinerDiv`);
    mapMinerDiv.empty();
    for (let mapMinerIdx in availableMapMiners) {
        if (availableMapMiners[mapMinerIdx].features.indexOf(FeatureName) != -1) {
            let mapMiner = create_dropDown_aButton(availableMapMiners[mapMinerIdx].name, mapMinerIdx, this.selectMapMiner);
            mapMinerDiv.append(mapMiner);
        }
    }
}

function setFeaturesFromMapMiner(MapMiner, clearFeatures) {
    //TODO: Remove this way of define default value without warnings
    if (typeof (clearFeatures) === "undefined") clearFeatures = false;

    let MapMinerFeatures = MapMiner.features;

    let mapFeatureDiv = $(`#mapFeatureDiv`);
    if (clearFeatures) mapFeatureDiv.empty();

    for (let featureIdx in MapMiner.features) {
        let featureName = MapMiner.features[featureIdx];
        let mapFeature = create_dropDown_aButton(featureName, featureName, this.selectMapFeature);
        mapFeatureDiv.append(mapFeature);
    }
}

function setAvailableImageMiners() {
    let imageMinerDiv = $(`#imageProviderDiv`);
    imageMinerDiv.empty();
    for (let imageMinerIdx in availableImageMiners) {
        let imageMinerName = availableImageMiners[imageMinerIdx].name;
        let imageMiner = create_dropDown_aButton(imageMinerName, imageMinerIdx, this.changeImageProviderClick);
        imageMinerDiv.append(imageMiner);
    }

}

function setAvailableMapMinersAndFeatures() {
    let mapMinerDiv = $(`#mapMinerDiv`);
    let mapFeatureDiv = $(`#mapFeatureDiv`);
    mapMinerDiv.empty();
    mapFeatureDiv.empty();
    for (let mapMinerId in availableMapMiners) {
        let mapMiner = create_dropDown_aButton(availableMapMiners[mapMinerId].name, mapMinerId, this.selectMapMiner);
        mapMinerDiv.append(mapMiner);
        setFeaturesFromMapMiner(availableMapMiners[mapMinerId], false);
    }

}

function drawLayer(layer, forceRedraw) {
    if (!layer) { console.warn("Undefined layer!"); return; }
    let featureCollection = layer.featureCollection;
    let olGeoJson = new ol.format.GeoJSON({ featureProjection: featureCollection.crs.properties.name });

    for (let featureIdx in featureCollection.features) {
        let feature = featureCollection.features[featureIdx];

        if (!usersection.isFeatureActive(layer.id, feature.id)) continue;

        if (usersection.featuresByLayerId[layer.id][feature.id].drawed){
            if (forceRedraw)
            {
                let olFeature = globalVectorSource.getFeatureById(feature.id);
                globalVectorSource.removeFeature(olFeature);
                olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
                globalVectorSource.addFeature(olFeature);
                usersection.featuresByLayerId[layer.id][feature.id].drawed = true;
            }
            else
            {
                continue;
            }
        }
        else {
            let olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
            globalVectorSource.addFeature(olFeature);
            usersection.featuresByLayerId[layer.id][feature.id].drawed = true;
        }

    }
}

function removeLayer(layer) {
    if (!layer) { console.warn("Undefined layer!"); return; }
    let featureCollection = layer.featureCollection;

    for (let featureIdx in featureCollection.features) {
        let feature = featureCollection.features[featureIdx];
        /*
        Each individual feature needs to be checked because it
        can belong to more than one layer (from differente regions)
        */
        if (!usersection.featuresByLayerId[layer.id][feature.id].drawed || usersection.isFeatureActive(layer.id, feature.id)) continue;
        else {
            let olFeature = globalVectorSource.getFeatureById(feature.id);
            globalVectorSource.removeFeature(olFeature);
            usersection.featuresByLayerId[layer.id][feature.id].drawed = false;
        }

    }
}

//#endregion UI Functions

//#region UI Auxiliary Functions

/**
* Changes the html of buttons to indicate it's busy.
* @param {JQueryObject} jqElement - An jquery element representing an html component (usually a button in this case)
*/
function setLoadingText(jqElement)
{
    let loadingText = '<i class="far fa-compass fa-spin"></i> Loading...';
    jqElement.data('original-text', jqElement.html());
    jqElement.html(loadingText);
}
/**
* Changes the html of buttons back to its unbusy state.
* @param {JQueryObject} jqElement - An jquery element representing an html component (usually a button in this case)
*/
function unsetLoadingText(jqElement)
{
    if (jqElement.data('original-text'))
    {
        jqElement.html(jqElement.data('original-text'));
    }
}

function disableSiblings(element) {
    element.siblings().each(function (it, val) {
        $('#' + val.id).removeClass('disabled');
    });
    element.addClass('disabled');
}

function create_dropDown_aButton(label, optValue, clickHandler) {
    let button = $(document.createElement('a'));
    button.addClass('dropdown-item');
    button.append(label);
    button.attr("href", "javascript:void(0);");
    button.click(null, clickHandler.bind(this, optValue));
    return button;
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

//#endregion UI Auxiliary Functions

//#region Event Handlers

/**
 * Function used to collect map features, from the server,
 * based on [UIState.SelectedMapMiner]{@link module:"home.js"~UIState.SelectedMapMiner}
 * and [UIState.SelectedMapFeature]{@link module:"home.js"~UIState.SelectedMapFeature}
 * @param {Event} event - Event object generated by clicking over the 'btnExecuteQuery' DOMElement button.
 */
function executeQuery(event) {
    let btnExecuteQuery = getClickedElement(event);
    
    /* To avoid race conditions during the ajax call */
    let selectedMapMiner = UIState.SelectedMapMiner;
    let selectedMapFeature = UIState.SelectedMapFeature;

    let noSelectedRegions = true;
    let numCalls = 0;
    try
    {
        setLoadingText(btnExecuteQuery);

        let olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
        
        for (let regionIdx in usersection.regions) {
            let region = usersection.getRegionById(regionIdx);

            if (!region.active) continue;
            let layerId = selectedMapMiner + "_" + selectedMapFeature;
            let layer = region.getLayerById(layerId);
            if (layer) continue;
            layer = region.createLayer(layerId);


            numCalls = numCalls + 1;
            noSelectedRegions = false;

            if (UIState.SelectedMapMiner === null) {
                alert("Please, select a Map Miner to continue.");
                unsetLoadingText(btnExecuteQuery);
                return;
            }
            if (UIState.SelectedMapFeature === null) {
                alert("Please, select a Feature to continue.");
                unsetLoadingText(btnExecuteQuery);
                return;
            }
        
            


            let geoJsonFeatures = olGeoJson.writeFeaturesObject([globalVectorSource.getFeatureById(region.id)]);

            geoJsonFeatures.crs = {
                "type": "name",
                "properties": {
                    "name": "EPSG:4326"
                }
            };
            getMapMinerFeatures(region, selectedMapMiner, selectedMapFeature, geoJsonFeatures)
            .then(function(data){
                layer.featureCollection = data;
                numCalls = numCalls - 1;
                if (numCalls == 0)
                {
                    unsetLoadingText(btnExecuteQuery);
                }
            })
            .catch(function (err) {
                defaultAjaxErrorHandler('executeQuery', "error", err);
            });
        }

        if (noSelectedRegions) {
            alert("No region selected. Please, select a region to make a request.")
        }
    }
    catch(err)
    {
        unsetLoadingText(btnExecuteQuery);
        defaultAjaxErrorHandler('executeQuery', null, err);
    }
}

function updateRegionsList(vectorevent) {
    switch (vectorevent.type) {
        case 'addfeature':
            if (!vectorevent.feature.getId()) {
                let idNumber = getNewId();
                let regionId = 'region' + idNumber;
                vectorevent.feature.setId(regionId);
                vectorevent.feature.setProperties({ 'type': 'region' });
                let newRegion = usersection.createRegion(regionId, `Region ${idNumber}`, false);
                Region.on('activechange', function (region) {
                    globalVectorSource.getFeatureById(region.id).setStyle(region.active ? selectedRegionStyle : null);
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
                });
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

function getClickedElement(event) {
    if (event.currentTarget) {
        return $(event.currentTarget);
    }
    else if (event.srcElement || event.id) {
        let elem_id = event.srcElement || event.id || event.currentTarget;
        let element = $('#' + elem_id);
        return element;
    }

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
        source: globalVectorSource,
        type: value,
        geometryFunction: geometryFunction
    });
    openLayersHandler.map.addInteraction(drawInteraction);
}
/**
* Handler for changing map tiles.
* @param {string} imageProviderId - Id defined in the back-end ImageMiner
* @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
*/
function changeImageProviderClick(imageProviderId, event) {
    if (!btnElementChecker(event)) return;
    UIState.SelectedImageProvider = imageProviderId;
    $(`#btnCollectImages`).removeClass("hidden");
    let imageProviderBtn = $(`#btnImageProvider`);
    imageProviderBtn.addClass("btn-success");
    imageProviderBtn.removeClass("btn-secondary");

    imageProviderBtn.html(availableImageMiners[imageProviderId].name);
}
/**
* Handler for changing map tiles.
* @param {string} mapProviderId - Id defined by OpenLayers to set a tile provider
* @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
*/
function changeMapProviderClick(mapProviderId, event) {
    if (!btnElementChecker(event)) return;
    openLayersHandler.changeMapProvider(mapProviderId);
}

//#endregion Event Handlers

//#region Auxiliar Functions for Event Handlers

/**
* Used to disable a button inside a selection group of buttons (i.e. Map Tiles provider).
* If the target (i.e. button) can't be defined "undefined" is returned.
* @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
* @returns {DOMElement|undefined} - See [Element]{@link https://developer.mozilla.org/en-US/docs/Web/API/Element}
*/
function btnElementChecker(event) {
    let element = getClickedElement(event);
    if (!element) return;
    if (element.hasClass('disabled')) return;
    disableSiblings(element);
    return element;
}

//#endregion Auxiliar Functions for Event Handlers

