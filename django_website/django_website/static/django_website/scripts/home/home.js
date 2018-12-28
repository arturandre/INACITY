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
* Used as a global auxiliary variable to allow drawing interactions over the map
* @type {ol.interaction.Draw}
* @see [ol.interaction.Draw]{@link https://openlayers.org/en/latest/apidoc/ol.interaction.Draw.html}
*/


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

    /* UIModel init*/
    //TODO: Make the defaults parameters part of an object (maybe a config file?)
    uiModel = new UIModel('regionsList', openLayersHandler, { mapMiner: "osm", mapFeature: "Streets" });
    uiModel.initialize().then(() => {
        geoImageManager = new GeoImageManager(uiModel, {defaultImageUrl: "https://maps.googleapis.com/maps/api/streetview?size=640x640&location=-23.560271,-46.731295&heading=180&pitch=-0.76&key=AIzaSyD5HdIiGhBEap1V9hHPjhq87wB07Swg-Gc"});

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
    //Default selections:
    /*
    * Tiles provider - Google maps road and satellite
    * Focus mode - Image mode
    * Box drawing tool
    * Google Street View Image Provider
    */
    
    $('#btnOSMMapsTiles').addClass('disabled');
    $('#btnImageMode').addClass('disabled');
    //changeShapeClick('Box', document.getElementById("btnBox"));
}

//#endregion Initializer functions

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

