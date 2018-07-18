/**
* Responsible for the interaction management at the home page
* @module "home.js"
*/



//#region Global variables

///**
// * Responsible for keeping user selections.
// * @todo Make it a class.
// * @param {string} SelectedMapMiner - Selected map miner's id
// * @param {string} SelectedMapFeature - Selected map features's id
// * @param {string} SelectedImageProvider - Selected image providers' id
// */
//var _UIHandler = {}
//_UIHandler.SelectedMapMiner = null;
//_UIHandler.SelectedMapFeature = null;
//_UIHandler.SelectedImageProvider = null;

var _UIHandler = null;

var geoImageManager = null;

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


//#region TESTING_MOVE TO THE TESTING MODULE

/**
 * Return variable used only for testing of features collection from NODE.JS
 * at callTest()
 * @todo move it to the testing module
 */
var mytestjson = undefined;

/**
 * Used only for testing of features collection from NODE.JS
 * @todo move it to the testing module
 */
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

//#endregion TESTING_MOVE TO THE TESTING MODULE

/**
 * JQuery ready function used to initialize variables
 */
$(document).ready(function () {
    /* Bootstrap tooltips initializer*/
    $('[data-toggle="tooltip"]').tooltip();

    initializeOpenLayers();

    initializeUserSection();

    initializeGeoImageManager();

    getServerParameters();

    initializeUIHandler();

    populateMapProviderDiv();

    setDefaults();
});

//#region Initializer functions

function initializeUIHandler()
{
    _UIHandler = new UIHandler();

}

function initializeGeoImageManager()
{
    geoImageManager = new GeoImageManager('imgUrbanPicture');
    GeoImageManager.on('geoimagescollectionchanged', updateGeoImgSlider);
    GeoImageManager.on('imagechanged', updateGeoImgSlider);
    
}

/**
 * Auxiliar function used to initialize OpenLayers related objects and events
 */
function initializeOpenLayers()
{
    /* OpenLayers init */
    openLayersHandler = new OpenLayersHandler('map', OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES.provider);

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
                //availableImageMiners = data;
                _UIHandler.populateImageProviderDiv(data);
                //setAvailableImageMiners();
            },
            "json"
            );
}

/**
 * Used to set default options such default drawing mode, map tiles provider, etc.
 * @todo Make changeShapeClick part of UIHandler class
 */
function setDefaults()
{
    //Default selections:
    /*
    * Tiles provider - Google maps road and satellite
    * Focus mode - Image mode
    * Box drawing tool
    */
    openLayersHandler.changeMapProvider(OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES.provider);
    $('#btnOSMMapsTiles').addClass('disabled');
    $('#btnImageMode').addClass('disabled');
    changeShapeClick('Box', document.getElementById("btnBox"));

}

//#endregion Initializer functions

//#region Caller functions

function getImages(event)
{
    let btnCollectImages = getClickedElement(event);
    let noLayers = true;

    //To avoid racing conditions
    let selectedImageProvider = _UIHandler.SelectedImageProvider;
    let numCalls = 0;
    try
    {
        setLoadingText(btnCollectImages);
        for (const regionIdx in usersection.regions)
        {
            let region = usersection.regions[regionIdx];
            for (const layerIdx in region.layers)
            {
                let layer = region.layers[layerIdx];
                if (!layer.active) continue;
                numCalls += 1;
                noLayers = false;
                //A layer without a FeatuerCollection, or with an empty FeatureCollection or that already got images will be skipped
                //@todo: Warn user about the skipped layers
                if (!layer.featureCollection || !layer.featureCollection.features || layer.featureCollection.features[0].properties.geoImages) continue;
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
                        geoImageManager.setCurrentGeoImagesCollection(data['featureCollection']);
                        if (geoImageManager.displayFeatures(true))
                        {
                            autoPlayGeoImages(1); //Play
                        }
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
        console.error(textStatus, errorThrown);
    else 
        console.error(textStatus);
}

//#endregion Auxiliar functions for caller functions

//#region UI Functions 

function populateMapProviderDiv()
{
    let mapProviderDiv = $(`#mapProviderDiv`);
    for (let tileProviderId in OpenLayersHandler.TileProviders)
    {
        let tileProvider = OpenLayersHandler.TileProviders[tileProviderId];
        mapProviderDiv.append(create_dropDown_aButton(tileProvider.name, tileProvider.provider, changeMapProviderClick));
    };
    //let GMRoadsBtn = create_dropDown_aButton('Google Maps Roads', OpenLayersHandler.TileProviders.GOOGLE_ROADMAP_TILES, changeMapProviderClick);
    //let GMHybridBtn = create_dropDown_aButton('Google Maps Hybrid', OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES, changeMapProviderClick);
    //let OSMBtn = create_dropDown_aButton('OpenStreetMap', OpenLayersHandler.TileProviders.GOOGLE_ROADMAP_TILES, changeMapProviderClick);

    //    <a id="btnGoogleMapsTiles" onclick="changeMapProviderClick(OpenLayersHandler.TileProviders.GOOGLE_ROADMAP_TILES, this)" class="dropdown-item" href="javascript:void(0);">Google Maps v3</a>
    //    <a id="btnOSMMapsTiles" onclick="changeMapProviderClick(OpenLayersHandler.TileProviders.OSM, this)" class="dropdown-item" href="javascript:void(0);">Open Layers (OpenStreetMap)</a>

}


function updateGeoImgSlider()
{
    let imgSliderDiv = $('#imgSliderDiv');
    //let imgSlider = $('#imgSlider');
    //Done this way to get value correctly (jquery is failing)
    let imgSlider = document.getElementById('imgSlider');

    let numGeoImages = geoImageManager.validImages;

    if (numGeoImages > 0)
    {
        imgSlider.min = 0;
        imgSlider.value = geoImageManager.currentIndex;
        imgSlider.max = numGeoImages;
        imgSliderDiv.removeClass("hidden");
    }
    else
    {
        imgSliderDiv.addClass("hidden");
    }
}

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

    _UIHandler.SelectedMapMiner = mapMinerId;
    mapMinerBtn.html(availableMapMiners[mapMinerId].name);

    setFeaturesFromMapMiner(availableMapMiners[mapMinerId], true);
}

function selectMapFeature(mapFeatureName) {
    let mapFeatureBtn = $(`#mapFeatureBtn`);
    $(`#btnClearSelections`).removeClass("hidden");
    $(`#btnExecuteQuery`).removeClass("hidden");

    mapFeatureBtn.addClass("btn-success");
    mapFeatureBtn.removeClass("btn-secondary");

    _UIHandler.SelectedMapFeature = mapFeatureName;
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

var autoPlayIntervalID = null;
const autoPlayTimeInterval = 3000; //3 seconds
var autoPlayState = 0;

/**
 * Changes automatically the currently presented geoImage
 * @param {int} autoPlayState - Controls the state of GeoImageManager's autoplay
 * 0 - Stopped -> Will restart the GeoImageManager counter when started.
 * 1 - Playing -> Can be stopped (reseted) or paused.
 * 2 - Paused -> Will continue from the last presented GeoImage when restarted.
 */
function autoPlayGeoImages(autoPlayNewState)
{
    if (autoPlayState === autoPlayNewState)
    {
        console.warn(`Tried to repeat GeoImageManager's autoplay state: ${autoPlayNewState}`);
        return false;
    }
    else if (autoPlayState === 0 && autoPlayNewState === 2){
        console.warn("Tried to pause autoplay while it was in the stopped state");
        return false;
    }

    if (autoPlayState === 0 && autoPlayNewState === 1) //Stopped -> Playing
    {
        autoPlayIntervalID = setInterval(function(){
            geoImageManager.displayFeatures(false);
        }, autoPlayTimeInterval);
    }
    else if (autoPlayState === 2  && autoPlayNewState === 1) //Paused -> Playing
    {
        autoPlayIntervalID = setInterval(function(){
            geoImageManager.displayFeatures(false);
        }, autoPlayTimeInterval);
    }
    else if ((autoPlayState === 1 || autoPlayState === 2) && (autoPlayNewState === 0 || autoPlayNewState === 2)) //Playing/Paused -> Stopped/Paused
    {
        clearInterval(autoPlayIntervalID);
    }
    else
    {
        console.error(`Unrecognized autoPlayNewState code: ${autoPlayNewState}.`);
        return false;
    }
    autoPlayState = autoPlayNewState
    return true;
}

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

/**
 * Remove the 'disabled' css class from the element passed as parameter and adds the
 * 'disabled' css class to any siblings (other elements with a common parent element) of the element.
 * @param {JQueryObject} element - A DOMElement encapsulated with JQuery (i.e. $('#myElementId') )
 */
function disableSiblings(element) {
    element.siblings().each(function (it, val) {
        //$('#' + val.id).removeClass('disabled');
        $(val).removeClass('disabled');
    });
    element.addClass('disabled');
}

/**
 * Creates an anchor button (<a href...>)
 * @param {string} label - The button title
 * @param {object} optValue - The parameter to be used for the click handler
 * @param {function} clickHandler - A function that receives "optValue" as parameter and is triggered when the button is clicked
 */
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



    _UIHandler.SelectedMapMiner = null;
    _UIHandler.SelectedMapFeature = null;
    setAvailableMapMinersAndFeatures();
}

//#endregion UI Auxiliary Functions

//#region Event Handlers

/**
 * Updates the currently image displayed by the GeoImageManager
 * when the user changes the imgSlider value (position).
 * @param {int} value - The current position of the imgSlider as informed by itself
 */
function imageSliderChange(value)
{
    geoImageManager.displayFeatureAtIndex(value, true);
    if (autoPlayState === 1)
    {
        autoPlayGeoImages(2); //Pauses the autoPlayGeoImages
    }
}

/**
 * Function used to collect map features, from the server,
 * based on [UIHandler.SelectedMapMiner]{@link module:"UIHandler.js"~UIHandler.SelectedMapMiner}
 * and [UIHandler.SelectedMapFeature]{@link module:"UIHandler.js"~UIHandler.SelectedMapFeature}
 * @param {Event} event - Event object generated by clicking over the 'btnExecuteQuery' DOMElement button.
 */
function executeQuery(event) {
    let btnExecuteQuery = getClickedElement(event);
    
    /* To avoid race conditions during the ajax call */
    let selectedMapMiner = _UIHandler.SelectedMapMiner;
    let selectedMapFeature = _UIHandler.SelectedMapFeature;

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

            if (_UIHandler.SelectedMapMiner === null) {
                alert("Please, select a Map Miner to continue.");
                unsetLoadingText(btnExecuteQuery);
                return;
            }
            if (_UIHandler.SelectedMapFeature === null) {
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
 * Used to extract the object that caused an event to be triggered from the event object itself.
 * @param {MouseEvent} event - @see [MouseEvent]{@link https://developer.mozilla.org/en-US/docs/Web/Events/click}
 */
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

