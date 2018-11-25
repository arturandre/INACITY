/**
* Responsible for the interaction management at the home page
* @module "home.js"
*/



//#region Global variables

var uiView = null;

var geoImageManager = null;

/** 
* Handler for the OpenLayers object
* @type {OpenLayersHandler}
* @see {@link module:OpenLayersHandler~OpenLayersHandler}
*/
var openLayersHandler = null;




/**
* Usersection variable used to keep the state of objects collected
* @type {UIModel}
* @see {@link module:UIModel~UIModel}
*/
var uiModel = null;

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

    initializeUI();

    setDefaults();
});

//#region Initializer functions

/** 
 * @todo: Make the defaults parameters part of an object (maybe a config file?)
*/
function initializeUI() {
    /* OpenLayers init */
    let openLayersHandler = new OpenLayersHandler('map', OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES.provider);

    /** 
     * @todo: Make the defaults parameters part of an object (maybe a config file?)
    */
    /* UIModel init*/
    uiModel = new UIModel('regionsList', openLayersHandler, { mapMiner: "osm", mapFeature: "Streets" });
    uiModel.initialize().then(() => {
        geoImageManager = new GeoImageManager(uiModel);

        uiView = new UIView(
            uiModel,
            geoImageManager,
            {
                shape: UIView.DrawTools.Box,
                tileProvider: OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES,
                imageProvider: "gsvProvider", //Retrieved from server
                imageFilter: "greenery",      //Retrieved from server
                mapMiner: "osm",              //Retrieved from server
                mapFeature: "Streets",        //Retrieved from server
                viewmode: UIView.ViewModes.ImageMode
            });


        uiController = new UIController(uiModel, uiView, geoImageManager);

        uiController.initialize();
        uiView.initialize();
        uiModel.loadSession();
    }, console.error);
}

/**
 * Used to set default options such default drawing mode, map tiles provider, etc.
 * @todo Make changeShapeClick part of UIView class
 */
function setDefaults() {
    $('#btnOSMMapsTiles').addClass('disabled');
    $('#btnImageMode').addClass('disabled');
    //changeShapeClick('Box', document.getElementById("btnBox"));
}

//#endregion Initializer functions

//#region Caller functions



function getMapMinerFeatures(region, selectedMapMiner, selectedMapFeature, geoJsonFeatures) {
    return new Promise(function (resolve) {
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
                    return resolve(data);
                }.bind(region),
                error: function (jqXHR, textStatus, errorThrown) {
                    defaultAjaxErrorHandler('executeQuery', textStatus, errorThrown);
                    //reject(errorThrown);
                },
            });
    });
}

//#endregion Caller functions

//#region Auxiliar functions for caller functions

/**
* Auxiliar function to display to the user eventual errors during ajax calls
* @param {string} locationName - Indication of where the error occured. (i.e. function's name)
* @param {string} textStatus - The type of error that occurred and an optional exception object, if one occurred. Possible values for the second argument (besides null) are "timeout", "error", "abort", and "parsererror".
* @param {string} errorThrown - When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
* @see {@link http://api.jquery.com/jquery.ajax/}
*/
function defaultAjaxErrorHandler(locationName, textStatus, errorThrown) {
    alert(gettext('Error during server at') + `: ${locationName}. ` + gettext('Status') + `: ${textStatus}. ` + gettext('Error message') + ` : ${errorThrown} `);
    if (errorThrown)
        console.error(textStatus, errorThrown);
    else
        console.error(textStatus);
}

//#endregion Auxiliar functions for caller functions

//#region UI Auxiliary Functions

/**
 * Removes the 'disabled' css class from the element passed as parameter and adds the
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



//#endregion UI Auxiliary Functions

//#region Event Handlers










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
* @param {Event} event - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
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

