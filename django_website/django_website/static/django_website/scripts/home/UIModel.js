/**
 * UIModel module contains classes used by the UIModel class to keep
 * track of the application state, as the user interacts with it.
 * @module UIModel
 */


class RegionLayer extends Subject {

    constructor(layerId) {
        super();
        if (!(layerId.MapMiner && layerId.Feature)) {
            throw new Error("Invalid layerId, it should have 'MapMiner' and 'Feature' fields.");
        }

        this._layerId = layerId;
        this._featureCollection = null;
    }

    saveToJSON() {
        let layerSession = {
            layerId: this._layerId.saveToJSON(),
            featureCollection: this._featureCollection
        };
        return layerSession;
    }

    static createFromJSON(layerSession) {
        let layerId = LayerId.createFromJSON(layerSession.layerId);

        let ret = new Layer(layerId);

        debugger;

        ret.featureCollection = layerSession.featureCollection;
        return ret;
    }

    loadFromJSON(layerSession) {
        this._featureCollection = layerSession.featureCollection;
    }

    /** 
     * @param {LayerId} layerId - The LayerId object representing the MapMinerId and FeatureName displayed in this layer
     * @property {Label} layerId.MapMiner - The MapMiner used to collect the features from this layer
     * @property {Label} layerId.Feature - Feature's name as reported by the backend
     */
    get layerId() { return this._layerId; }

    get featureCollection() {
        if ((!this._featureCollection)
            || this._featureCollection.length === 0)
            return null;
        return this._featureCollection;
    }

    /** 
     * Represents all the geographical features (e.g. Streets) in this layer
     * @param {FeatureCollection} newFeatureCollection - New feature collection value (GeoJSON)
     * @acess public 
     * @fires [featurecollectionchange]{@link module:UIModel~Layer#featurecollectionchange}
     */
    set featureCollection(newFeatureCollection) {
        let triggered = (this._featureCollection !== newFeatureCollection);

        this._featureCollection = {};

        for (let key in newFeatureCollection) {
            if (key !== 'features') {
                this._featureCollection[key] = newFeatureCollection[key];
            }
        }

        this._featureCollection.features = [];

        for (let idx in newFeatureCollection.features) {
            let featureId = newFeatureCollection.features[idx].id;
            this._featureCollection.features.push(featureId);
        }

        if (triggered) {
            RegionLayer.notify('featurecollectionchange', this);
        }
    }
}

/** Triggered when a new set of features is assined to the [featureCollection]{@link module:UIModel~Layer#featureCollection} member.
* @event module:UIModel~RegionLayer#featurecollectionchange
* @param {RegionLayer}
*/
//Singleton approach
if (!RegionLayer.init) {
    RegionLayer.init = true;
    RegionLayer.registerEventNames([
        'featurecollectionchange'
    ]);
}




/**
 * Each layer is named after a MapMiner and a Feature (e.g. Streets)
 * concatenated by an underscore (e.g. osm - streets).
 * Each Layer contains a list of geographical features called featureCollection.
 * A Layer should be identified by a [LayerId]{@link LayerId} object.
 * Layer keeps track of vector features (e.g. Points, Lines, Polygons, ...)
 * related with some Map Miner (e.g OSM) and Geographic Feature Type (e.g. Street)
 * @param {LayerId} layerId - Represents an Id object for a Layer
 * @param {Label} layerId.MapMiner - The MapMiner used to collect the features from this layer
 * @param {Label} layerId.Feature - Feature's name as reported by the backend
 * @param {bool} active - Indicates if this layers is currently active (e.g. drawed over the map)
 */
// class Layer extends Subject
// {

//     constructor(layerId, active)
//     {
//         super();

//         if (!(layerId.MapMiner && layerId.Feature))
//         {
//             throw new Error("Invalid layerId, it should have 'MapMiner' and 'Feature' fields.");
//         }

//         this._layerId = layerId;
//         this._featureCollection = null;
//         // this.hasOlFeatures = false;
//     }

//     /**
//      * Updates a single feature
//      * from the _featureCollection.
//      * 
//      * Notice that the updated feature
//      * is the one returned by featureCollectionOL
//      * since the featureCollection is just
//      * an accessor that converts the former
//      * into a GeoJson representation.
//      */
//     // updateFeature(GeoJSONFeature)
//     // {
//     //     let fIdx = this._featureCollection
//     //         .features
//     //         .findIndex(f => f.getProperties().name === GeoJSONFeature.id)
//     //     this._featureCollection.features[fIdx] =
//     //         GeoJSONHelper.olGeoJson.readFeature(GeoJSONFeature);
//     // }

//     saveToJSON()
//     {
//         let layerSession = {
//             layerId: this._layerId.saveToJSON(),
//             active: this.active,
//             geoImagesLoaded: this.geoImagesLoaded
//         };
//         if (this.featureCollection)
//         {
//             layerSession.featureCollection = {};
//             for (var key in this.featureCollection)
//             {
//                 if (key !== 'features')
//                 {
//                     layerSession.featureCollection[key] = this.featureCollection[key];
//                 }
//             }
//             layerSession.featureCollection.features =
//                 this.featureCollection.features;
//             layerSession.featureCollection.hasOlFeatures = false;
//         }
//         return layerSession;
//     }

//     static createFromJSON(layerSession)
//     {
//         let layerId = LayerId.createFromJSON(layerSession.layerId);

//         let ret = new Layer(layerId, layerSession.active);

//         ret.featureCollection = layerSession.featureCollection;
//         ret.active = layerSession.active;
//         ret.geoImagesLoaded = layerSession.geoImagesLoaded;
//         return ret;
//     }

//     loadFromJSON(layerSession)
//     {
//         this.featureCollection = layerSession.featureCollection;
//         this.active = layerSession.active;
//         this.geoImagesLoaded = layerSession.geoImagesLoaded;
//     }

//     get active() { return this._active; }

//     get geoImagesLoaded() { return this._geoImagesLoaded; }
//     set geoImagesLoaded(newState)
//     {
//         let triggered = (newState !== this._geoImagesLoaded);
//         this._geoImagesLoaded = newState;
//         if (triggered)
//         {
//             Layer.notify('featurecollectionchange', this);
//         }
//     }

//     /** 
//      * @param {LayerId} layerId - The LayerId object representing the MapMinerId and FeatureName displayed in this layer
//      * @property {Label} layerId.MapMiner - The MapMiner used to collect the features from this layer
//      * @property {Label} layerId.Feature - Feature's name as reported by the backend
//      */
//     get layerId() { return this._layerId; }

//     get featureCollectionOL() { return this._featureCollection; }
//     get featureCollection()
//     {
//         if (!this._featureCollection) return null;
//         let ret = {};
//         for (let key in this._featureCollection)
//         {
//             if (key !== 'features')
//             {
//                 ret[key] = this._featureCollection[key];
//             }
//         }
//         if (getPropPath(this, ['_featureCollection', 'features']))
//         {
//             ret['features'] = GeoJSONHelper.writeFeatures(this._featureCollection.features);

//         }
//         ret.hasOlFeatures = false;
//         return ret;
//     }

//     /**
//      * The active property controls wheter the features should or not be rendered 
//      * @param {Boolean} newActiveState - New value for active attribute
//      * @acess public 
//      * @fires [activechange]{@link module:UIModel~Layer#activechange}
//      */
//     set active(newActiveState)
//     {
//         let triggered = (newActiveState !== this._active);
//         this._active = newActiveState;
//         if (triggered)
//         {
//             Layer.notify('activechange', this);
//         }
//     }

//     /** 
//      * Represents all the geographical features (e.g. Streets) in this layer
//      * @param {FeatureCollection} newFeatureCollection - New feature collection value (GeoJSON)
//      * @acess public 
//      * @fires [featurecollectionchange]{@link module:UIModel~Layer#featurecollectionchange}
//      */
//     set featureCollection(newFeatureCollection)
//     {
//         let triggered = (this._featureCollection !== newFeatureCollection);

//         // Keep state
//         // newFeatureCollection.drawed = getPropPath(this, ['_featureCollection', 'drawed']);
//         // if (!newFeatureCollection.hasOlFeatures)
//         // {
//         //     let olGeoJson = new ol.format.GeoJSON(
//         //         {
//         //             featureProjection: newFeatureCollection.crs.properties.name
//         //         });
//         //     newFeatureCollection.features = olGeoJson.readFeatures(newFeatureCollection);
//         //     newFeatureCollection.hasOlFeatures = true;
//         // }

//         this._featureCollection = {};

//         for (let key in newFeatureCollection)
//         {
//             if (key !== 'features')
//             {
//                 this._featureCollection[key] = newFeatureCollection[key];
//             }
//         }

//         this._featureCollection.features = [];

//         for (let idx in newFeatureCollection.features)
//         {
//             let feature = newFeatureCollection.features[idx];
//             this._featureCollection.features.push(feature.id);
//         }

//         // newFeatureCollection.features.forEach(
//         //     feature =>
//         //     {
//         //         feature.setProperties({ 'layerId': this.layerId.toString() });
//         //     });

//         //let activeState = this._featureCollection ? this._featureCollection.drawed : undefined;

//         // this._featureCollection = newFeatureCollection;

//         // Restore state
//         //this._featureCollection.drawed = activeState;

//         // if (getPropPath(this, ['featureCollection', 'features', "0",
//         //     'properties', 'geoImages']))
//         // {
//         //     this.geoImagesLoaded = true;
//         // }

//         if (triggered)
//         {
//             /**
//              * @todo: Every listener from featurecollectionchange
//              * will be now a listener from featurecreated
//              * and featureupdated.
//              * */
//             Layer.notify('featurecollectionchange', this);
//         }
//     }
// }

class LayerId {
    constructor(mapMiner, feature) {
        this.MapMiner = mapMiner;
        this.Feature = feature;
    }

    toString() {
        return this.MapMiner.name + " - " + this.Feature.name;
    }

    saveToJSON() {
        let layerIdJSON = {
            MapMiner: this.MapMiner,
            Feature: this.Feature
        };
        return layerIdJSON;
    }

    static createFromJSON(layerIdJSON) {

        return (new LayerId(layerIdJSON.MapMiner, layerIdJSON.Feature));
    }

    loadFromJSON(layerIdJSON) {
        this.MapMiner = layerIdJSON.MapMiner;
        this.Feature = layerIdJSON.Feature;
    }
}

// /**
//  * Initializes a LayerId Object
//  * @param {Label} mapMiner - MapMiner's Id as reported by the backend
//  * @param {Label} feature - Feature's name as reported by the backend
//  * @returns {LayerId} The object to represent a layer's id
//  */
// RegionLayer.createLayerId = function (mapMiner, feature)
// {
//     return new LayerId(mapMiner, feature);
// }

// /** Triggered when a new set of features is assined to the [featureCollection]{@link module:UIModel~Layer#featureCollection} member.
// * @event module:UIModel~Layer#featurecollectionchange
// * @param {Layer}
// */
// /**
// * Triggered when the [active]{@link module:UIModel~Layer#active} property changes (It wont trigger if the assined value is the current value).
// * @event module:UIModel~Layer#activechange
// * @param {Layer}
// */
// //Singleton approach
// if (!Layer.init)
// {
//     Layer.init = true;
//     Layer.registerEventNames([
//         'featurecollectionchange',
//         'activechange',
//     ]);
// }

/**
* A region defines boundaries for regions of interest 
* and keeps track of geographical features collected for it.
* @param {string} id - Region identifier.
* @param {string} name - Region display name.
* @param {boolean} active - Represents if the region is in user's current selection or not.
*/
class Region extends Subject {
    constructor(id, name, active, boundaries) {
        super();

        if (Array.isArray(boundaries)) {
            boundaries = new ol.Feature(
                new ol.geom.Polygon(boundaries));
        }
        else {
            try {
                let olFeatureBoundary = GeoJSONHelper.olGeoJson.readFeature(boundaries);
                boundaries = olFeatureBoundary;
            } catch (error) {
                //'boundaries' is already an OpenLayer feature object
            }
        }

        active = typeof (active) === 'undefined' ? false : active;
        this._id = id;
        this._name = name;

        this._layers = {};

        this._active = active;


        this._boundaries = boundaries;
        this._boundaries.setStyle(
            this._active ?
                OpenLayersHandler.Styles.selectedRegionStyle
                : OpenLayersHandler.Styles.transparentStyle
        );
        this._boundaries.setId(this._id);
        this._boundaries.setProperties({ "type": "region" });
    }

    get boundaries() { return this._boundaries; }

    saveToJSON() {
        let layersJSON = {};
        for (let layerKey in this.layers) {
            layersJSON[layerKey] = this.layers[layerKey].saveToJSON();
        }
        let regionSession = {
            id: this.id,
            name: this.name,
            active: this._active,
            boundaries: GeoJSONHelper.olGeoJson.writeFeature(this._boundaries),
            layers: layersJSON
        };
        return regionSession;
    }

    static createFromJSON(regionSession) {
        let ret = new Region(regionSession.id, regionSession.name, regionSession.active);

        for (let layerKey in regionSession.layers) {
            ret[layerKey] = RegionLayer.createFromJSON(regionSession.layers[layerKey]);
        }
        return ret;
    }

    loadFromJSON(regionSession) {
        for (let layerKey in regionSession.layers) {
            let layerSession = regionSession.layers[layerKey];
            let layerId = LayerId.createFromJSON(layerSession.layerId);
            let layer = this.createLayer(layerId);
            let test_featureCollection =
                getPropPath(layerSession, ['featureCollection', 'features']);
            if (test_featureCollection && test_featureCollection.length > 0) {
                layer.loadFromJSON(layerSession);
            }
        }
    }

    /** Creates a new Layer with the specified id
    * @param {LayerId} layerId - Layer's identifier
    * @returns {Layer} - A new instance of Layer
    * @fires [addlayer]{@link module:UIModel~Region#addlayer}
    */
    createLayer(layerId) {
        if (!getPropPath(this, ["layers", layerId.toString()])) {
            //if (!this.getLayerById(layerId)) {
            let newLayer = new RegionLayer(layerId);
            this._layers[layerId.toString()] = newLayer;
            Region.notify('addlayer', newLayer);
            return newLayer;
        }
        else {
            throw Error(`layerId: '${layerId.toString()}' already present in layers list of this region (${this.name})!`);
        }
    }

    /** [De]activate a region for displaying or colleting geographical features. 
     * @returns {Boolean} - The new active value
     * @fires [activechange]{@link module:UIModel~Region#activechange}
     */
    toggleActive() {
        this.active = !this.active;
        return this.active;
    }

    /** 
     * Getter for id 
     * @type {string}
     */
    get id() { return this._id; }
    /** 
     * Getter for name
     * @type {string}
     */
    get name() { return this._name; }


    get layers() { return this._layers; }

    // getActiveLayers()
    // {
    //     let activeLayers = [];
    //     for (let layerIdx in this._layers)
    //     {
    //         const layer = this._layers[layerIdx];
    //         if (layer.active)
    //         {
    //             activeLayers.push(layer);
    //         }
    //     }
    //     return activeLayers;
    // }

    // getLayerById(_layerId) {
    //     for (let layerIdx in this._layers) {
    //         const layerId = this._layers[layerIdx].layerId;
    //         if (layerId.MapMiner.id === _layerId.MapMiner.id
    //             && layerId.Feature.id === _layerId.Feature.id) {
    //             return this._layers[layerIdx];
    //         }
    //     }
    //     return null;
    // }

    get active() { return this._active; }

    /**
     * @param {Boolean} newState - New value for the 'active' property
     * @type {boolean}
     * @fires [activechange]{@link module:UIModel~Region#activechange}
     */
    set active(newState) {
        if (typeof (newState) !== "boolean")
            throw Error(`newState parameter type should be boolean, but is: ${typeof (newState)}`);
        let triggerActiveChange = this._active !== newState;
        this._active = newState;
        this._boundaries.setStyle(
            this._active ?
                OpenLayersHandler.Styles.selectedRegionStyle
                : OpenLayersHandler.Styles.transparentStyle
        );
        // for (let layerIdx in this._layers)
        // {
        //     this._layers[layerIdx].active = newState;
        // }
        if (triggerActiveChange) {
            Region.notify('activechange', this);
        }
    }
}

/** 
* Triggered by a mouse click event in the user interface
* @event module:UIModel~Region#activechange
* @type {Region}
* @property {Region} region - The region object [de]activated.
* @property {boolean} region.active - Indicates if this region is active or not.
* @property {string} region.id - Indicates the id of the region [de]activated.
* @property {string} region.name - Indicates the display name of this region.
*/
/** 
*  Triggered when a new [Layer]{@link module:UIModel~Layer} is created (through [createLayer]{@link module:UIModel~Region#createLayer}) in this region
* @event module:UIModel~Region#addlayer
* @type {Layer}
* @See [Layer]{@link module:UIModel~Layer}
*/
//Singleton approach
if (!Region.init) {
    Region.init = true;
    Region.registerEventNames([
        'activechange',
        'addlayer',
    ]);
}

/**
 * Simple class for holding features and their respective regions
 * @param {Feature} feature - A GeoJson Feature
 * @param {string[]} regions - A list of region Ids representing the regions to which this [FeatureRegions.feature]{@link module:UIModel~FeatureRegions.feature} belongs
 */
class FeatureRegions {
    constructor(feature, regions) {
        this.feature = feature;
        this.regions = regions;
    }

    saveToJSON() {
        let ret = {};
        ret.regions = this.regions;
        ret.feature = GeoJSONHelper.writeFeature(this.feature);
        return ret;
    }

    static createFromJSON(featureRegionSession) {
        let ret = new FeatureRegions
            (
                GeoJSONHelper.olGeoJson.readFeature(featureRegionSession.feature),
                featureRegionSession.regions
            );
        return ret;
    }
}

/**
 * Records application state, and performs ajax calls to backend
* @param {div} regionsDivId - An HTML div element responsible for displaying the list of regions of interest selected by the user.
* @param {OpenLayersHandler} - Instance of OpenLayersHandler
* @param {Object} - default parameters
* @param {Object.mapMiner} - Default map miner selection (e.g. OSM)
* @param {Object.mapFeature} - Default map feature selection (e.g. Streets)
*/
class UIModel extends Subject {
    constructor(regionsDivId, openLayersHandler, streetSelect) {
        super();
        this.setTarget(regionsDivId);


        //Used to avoid loops while change image displayed index by the slider at home template
        this.imgSliderMoving = false;

        //#region View state variables


        this._SelectedMapMiner = null;
        this._SelectedMapFeature = null;
        this._SelectedImageProvider = null;
        this._SelectedImageFilter = null;

        // this._SelectedMapProvider = null;

        // this._SelectedDrawTool = null;
        // this._drawInteraction = null;

        this._SelectedViewMode = null;

        //#endregion View state variables

        this._regions = {};
        this._featuresByLayerId = {};

        this._imageProviders = [];
        this._imageFilters = [];
        this._mapMinersAndFeatures = [];

        this._openLayersHandler = openLayersHandler;
        this._streetSelect = streetSelect;
        //this._geoImageManager = geoImageManager;

        /*OpenLayers Event Handlers*/
        this._openLayersHandler.globalVectorSource.on('addfeature', this.updateRegionsList, this);
        this._openLayersHandler.globalVectorSource.on('removefeature', this.updateRegionsList, this);
        this._openLayersHandler.globalVectorSource.on('changefeature', this.updateRegionsList, this);
    }

    setDefaults(defaults) {
        if (defaults) {
            if (defaults.mapMiner) {
                this.SelectedMapMiner = this.mapMinersAndFeatures.find(p => p.id === defaults.mapMiner);
                if (defaults.mapFeature) {
                    this.SelectedMapFeature = this.SelectedMapMiner.features.find(p => p.id === defaults.mapFeature);
                }
            }
            if (defaults.imageProvider) {
                this.SelectedImageProvider = this.imageProviders.find(p => p.id === defaults.imageProvider);
            }
            if (defaults.imageFilter) {
                this.SelectedImageFilter = this.imageFilters.find(p => p.id === defaults.imageFilter);
            }
            if (defaults.viewmode) {
                this.SelectedViewMode = defaults.viewmode;
            }
        }
    }

    get SelectedMapMiner() { return this._SelectedMapMiner; }
    set SelectedMapMiner(mapMiner) {
        this._SelectedMapMiner = mapMiner;
        if (!mapMiner) return;
        if ((mapMiner.features.length === 1) && !this._SelectedMapFeature) {
            this._SelectedMapFeature = mapMiner.features[0];
        }
    }

    get SelectedMapFeature() { return this._SelectedMapFeature; }
    set SelectedMapFeature(mapFeature) { this._SelectedMapFeature = mapFeature; }

    get SelectedImageProvider() { return this._SelectedImageProvider; }
    set SelectedImageProvider(imageProvider) {
        this._SelectedImageProvider = imageProvider;
    }

    get SelectedImageFilter() { return this._SelectedImageFilter; }
    set SelectedImageFilter(imageFilter) {
        this._SelectedImageFilter = imageFilter;
    }

    get SelectedViewMode() { return this._SelectedViewMode; }
    set SelectedViewMode(viewmode) {
        this._SelectedViewMode = viewmode;
    }

    //#endregion View's getters and setters

    get openLayersHandler() { return this._openLayersHandler; }

    updateRegionsList(vectorevent) {
        switch (vectorevent.type) {
            case 'addfeature':
                break;
            case 'removefeature':
                if (vectorevent.feature.getProperties()['type'] === 'region') {
                    // let featureId = vectorevent.feature.getId();
                    // this.removeRegion(featureId);
                }
                break;
            case 'changefeature':
                break;
            default:
                console.error(gettext('Unknown event type!'));
                break;
        }
        // if (vectorevent.feature.getProperties()['type'] === 'region') {
        //     this.saveSession();
        // }
    }



    /**
     * Collects images' providers and filters and maps' miners and features.
     * @returns {Promise} - All the providers as registered at server's side
     */
    async initialize() {
        let getServerDataPromises = Promise.all([this.getImageProviders(), this.getMapMinersAndFeatures(), this.getImageFilters()]);

        return getServerDataPromises;
    }

    get imageProviders() { return this._imageProviders; }
    get imageFilters() { return this._imageFilters; }
    get mapMinersAndFeatures() { return this._mapMinersAndFeatures; }

    /**
     * Extracts the features from the featuresByLayerId
     * index, converts then to the GeoJSON format and
     * return a valid GeoJSON FeatureCollection object
     * @param {RegionLayer} regionLayer 
     */
    getFeatureCollectionFromFeaturesByLayerIndex(regionLayer) {
        let ret = $.extend(true, {}, regionLayer.featureCollection);
        let features = getPropPath(regionLayer, ['featureCollection', 'features']);
        if (!features) return ret;
        for (let fId in features) {
            let feature = regionLayer.featureCollection.features[fId];
            ret.features[fId] =
                GeoJSONHelper.writeFeature(this.featuresByLayerId[regionLayer.layerId.toString()][feature].feature);
            if (ret.features[fId].properties.layerId) {
                if (!(ret.features[fId].properties.layerId instanceof LayerId)) {
                    ret.features[fId].properties.layerId = LayerId.createFromJSON(ret.features[fId].properties.layerId);
                }
            }
        }
        return ret;
    }

    /**
     * This function queries the SelectedMapMiner for the 
     * SelectedMapFeature and creates a new layer
     * for the region parameter containing the fetched data.
     * 
     * @param {Region} region - The region of interest where the query for the
     *                          SelectedMapFeature should be done given the SelectedMapMiner
     */
    async _collectLayersForEmptyRegions(region) {
        let layerId = new LayerId(this.SelectedMapMiner, this.SelectedMapFeature);

        /* 
        * layerId when casted to String becomes "MapMiner - MapFeature"
        * (e.g. OpenStreetMap - Streets)
        */
        let layer = getPropPath(region, ['layers', layerId.toString()]);
        if (!layer) {
            layer = region.createLayer(layerId);
        }
        if (!layer.featureCollection) {
            await this.executeQuery(layerId);
            //this.saveSession();
            return;
        }
    }

    /**
     * Ref: https://nominatim.org/release-docs/develop/api/Search/
     * @param {String} address 
     */
    async searchAddress(address) {
        let simpleAddress = address.split(' ').join('/');
        let result = await $.ajax
            (
                "https://nominatim.openstreetmap.org/search/" + simpleAddress + "?format=json",
                {
                    method: 'GET',
                    context: this,
                    success: function (data, textStatus, jqXHR) {
                        return data;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        throw new Error(`${errorThrown}: ${jqXHR.responseText}`)
                    },
                });
        if (result.length > 0) {
            return result;
        }
        else {
            return await $.ajax
                (
                    "https://nominatim.openstreetmap.org/search",
                    {
                        method: 'GET',
                        data:
                        {
                            "q": address,
                            "format": "json",
                        },
                        context: this,
                        success: function (data, textStatus, jqXHR) {
                            return data;
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            throw new Error(`${errorThrown}: ${jqXHR.responseText}`)
                        },
                    });
        }
    }

    /**
     * Collect the images (given an Image Provider)
     * for a set of geographic features
     * @todo When updating a single feature (rather then a FeatureCollection)
     * @todo update that single feature into the corresponding FeatureCollection(s)
     * @todo This task requires that requests for images could be done
     * @todo in a partial way.
     */
    async getImages() {
        let numCalls = 0;

        let triggerGeoImages = false;

        if (this._streetSelect.lastSelectedFeature) {
            let geoJSONFeature = GeoJSONHelper.writeFeature(this._streetSelect.lastSelectedFeature);
            if (!geoJSONFeature.properties || geoJSONFeature.properties.geoImages) {
                console.warn(`Feature '${geoJSONFeature.id}' already fulfilled.`);
            }
            else {
                await GSVService.setPanoramaForFeature(geoJSONFeature);
                this._streetSelect.lastSelectedFeature
                    .setProperties(
                        {
                            geoImages: geoJSONFeature.properties.geoImages
                        })
            }
            UIModel.notify('getimages', null);
            return;
        }



        let activeRegions = this.getActiveRegions();
        if (activeRegions.length === 0) {
            //return reject(gettext("Please, select or activate a region to continue."));
            throw new Error(gettext("Please, select or activate a region to continue."));
        }
        for (let regionIdx in activeRegions) {
            let region = activeRegions[regionIdx];
            /*
              Case the user simply select a region and then try to get the images
              by default the Streets from OSM will be used as features
            */
            await this._collectLayersForEmptyRegions(region);

            let activeLayers = this.getActiveLayers();

            for (let layerIdx in activeLayers) {
                let layer = activeLayers[layerIdx];

                let featureCollection = this.getFeatureCollectionFromFeaturesByLayerIndex(layer);

                let properties = getPropPath(featureCollection, ['features', 0, 'properties']);
                if (!properties || properties.geoImages) {
                    console.warn(`Layer '${layer.layerId}' without features or already fulfilled.`);
                    continue;
                }

                numCalls += 1;
                /**
                 * layer.featureCollection always returns a copy
                 */
                let fc = featureCollection;
                await GSVService.setPanoramaForFeatureCollection(fc);
                this._updateFeatureCollectionFromLayerIdIndex(fc);
                numCalls -= 1;
                triggerGeoImages = true;
            }
            // if (numCalls === 0 && triggerGeoImages)
            // {
            UIModel.notify('getimages', null);
            // }
        }
    }

    async _getImagesForFeature(GeoJSONFeature) {
        if (getPropPath(GeoJSONFeature, ['properties', 'geoImages'])) {
            return GeoJSONFeature;
        }

        let data = await $.ajax('/getimagesforfeature/',
            {
                method: 'POST',
                processData: false,
                data: JSON.stringify({
                    'imageProviderName': this.SelectedImageProvider.id,
                    'feature': JSON.stringify(GeoJSONFeature)
                }),
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                context: this
            }).done(function (data, textStatus, XHR) {
                let feature = data.feature;
                feature.properties.layerId = LayerId.createFromJSON(feature.properties.layerId);
                this._syncAndMergeMultiFeature(feature);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                //@todo: Create a error handling mechanism
                if (jqXHR.status === 413) {
                    alert(gettext("The request was too big to be processed. Try a smaller feature."));
                }
                else {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`)
                }
            });
        return data.feature;
    }

    /**
     * Each image filter can return different kinds of responses like
     * a greenery view index (0-100%) or a boolean flag indication if there's
     * an intersection between the trees greenery and pole wires.
     * 
     * This function sends a feature collection already filled with geoImages. 
     * The data processed by the filters will be appended to each GeoImage as the
     * property processedData['filterId']
     * @param {string} selectedImageFilter - Indicates which filter should be used to process images from the active layers.
     * @returns {Promise} - Empty
     * @todo: Treat parcial returns, the user should be able to see the results as they are being received, rather than wait all of them.
     */
    async getImages_ex() {
        let noCalls = true;

        if (this._streetSelect.lastSelectedFeature) {
            let geoImagesTree =
                this._streetSelect.lastSelectedFeature.getProperties().geoImages;

            if (geoImagesTree) {
                UIModel.notify('getimages', null);
                return;
            }

            let geoJSONFeature = GeoJSONHelper.writeFeature(this._streetSelect.lastSelectedFeature);
            await GSVService.setPanoramaForFeature(geoJSONFeature);

            let imagedFeature = await this._getImagesForFeature(geoJSONFeature);
            let imagedFeatureProperties = getPropPath(imagedFeature, ['feature', 'properties']) || getPropPath(imagedFeature, ['properties'])

            this._streetSelect.lastSelectedFeature.setProperties({
                geoImages:
                    imagedFeatureProperties.geoImages
            });



            UIModel.notify('getimages', { filterId: this.SelectedImageFilter.id });
            return;
        }


        let activeRegions = this.getActiveRegions();
        if (activeRegions.length === 0) {
            throw new Error(gettext("Please, select or activate a region to continue."));
        }
        let promisesFeatures = [];
        let skippedLayers = [];
        for (let regionIdx in activeRegions) {
            var region = activeRegions[regionIdx];
            /*
              Case the user simply select a region and then try to get the images
              by default the Streets from OSM will be used as source for
              sample feature. The feature to be used as sample will be by
              default "Street".
            */
            await this._collectLayersForEmptyRegions(region);//.then(() => {


            for (let layerIdx in region.layers) {
                let layer = region.layers[layerIdx];

                let features = getPropPath(layer, ['featureCollection', 'features']);
                if (!features) {
                    if (!layer.featureCollection) skippedLayers.reason = gettext("No featureCollection available!");
                    if (!layer.featureCollection.features) skippedLayers.reason = gettext("featureCollection without any features!");
                    //if (!layer.featureCollection.features[0].properties.geoImages) skippedLayers.reason = gettext("features without any images. Try to collect images for this layer before requesting them to be processed.");
                    //if (GeoImageCollection.isFiltered(layer.featureCollection.features[0].properties.geoImages, this.SelectedImageFilter.id)) skippedLayer.reason = gettext("This layer already has the requested processed images.");
                    skippedLayers.push(skippedLayers);
                    continue;
                }


                for (let featureIdx in features) {
                    let promise = new Promise(async function (resolve, reject) {
                        try {
                            let featureId = features[featureIdx];
                            let olFeature = this.featuresByLayerId[layer.layerId.toString()][featureId].feature;
                            let geoJSONFeature = GeoJSONHelper.writeFeature(olFeature);

                            // if (!geoJSONFeature.properties.geoImages)
                            // {
                            //     await this.getImages();
                            //     olFeature = this.featuresByLayerId[layer.layerId.toString()][featureId].feature;
                            //     geoJSONFeature = GeoJSONHelper.writeFeature(olFeature);
                            // }

                            let imagedFeature = await this._getImagesForFeature(geoJSONFeature);

                            olFeature.setProperties({
                                geoImages:
                                    imagedFeature.properties.geoImages
                            });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }.bind(this));
                    promisesFeatures.push(promise);
                }
            }
            await Promise.all(promisesFeatures).then(function () {
                UIModel.notify('getimages', null);
            }.bind(this));
            if (skippedLayers.length > 0) {
                let warnSkippedMessage = gettext("The following layers were skipped: \n");
                for (let skippedLayerIdx in skippedLayers) {
                    let skippedLayer = skippedLayers[skippedLayerIdx];
                    warnSkippedMessage += gettext("Layer: ") + skippedLayer.layerId + "."
                        + gettext(" From region: ") + skippedLayer.regionName + "."
                        + gettext(" Reason: ") + skippedLayer.reason + "\n";
                }
                alert(warnSkippedMessage);
            }
        }
        if (noCalls) return;
    }


    async _getProcessedImagesForFeature(GeoJSONFeature) {
        if (GeoImageCollection.isFiltered(GeoJSONFeature.properties.geoImages, this.SelectedImageFilter.id)) {
            return GeoJSONFeature;
        }

        let data = await $.ajax('/processimagesfromfeature/',
            {
                method: 'POST',
                processData: false,
                data: JSON.stringify({
                    'imageFilterId': this.SelectedImageFilter.id,
                    'feature': JSON.stringify(GeoJSONFeature)
                }),
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                context: this
            }).done(function (data, textStatus, XHR) {
                let feature = data.feature;
                feature.properties.layerId = LayerId.createFromJSON(feature.properties.layerId);
                this._syncAndMergeMultiFeature(feature);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                //@todo: Create a error handling mechanism
                if (jqXHR.status === 413) {
                    alert(gettext("The request was too big to be processed. Try a smaller feature."));
                }
                else {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`)
                }
            });
        return data.feature;

    }



    /**
     * Each image filter can return different kinds of responses like
     * a greenery view index (0-100%) or a boolean flag indication if there's
     * an intersection between the trees greenery and pole wires.
     * 
     * This function sends a feature collection already filled with geoImages. 
     * The data processed by the filters will be appended to each GeoImage as the
     * property processedData['filterId']
     * @param {string} selectedImageFilter - Indicates which filter should be used to process images from the active layers.
     * @returns {Promise} - Empty
     * @todo: Treat parcial returns, the user should be able to see the results as they are being received, rather than wait all of them.
     */
    async getProcessedImages() {
        let noCalls = true;

        if (this._streetSelect.lastSelectedFeature) {
            let geoImagesTree =
                this._streetSelect.lastSelectedFeature.getProperties().geoImages;

            if (!geoImagesTree) {
                await this.getImages();
            }

            if (geoImagesTree
                && GeoImageCollection.isFiltered(geoImagesTree, this.SelectedImageFilter.id)) {
                UIModel.notify('getimages', { filterId: this.SelectedImageFilter.id });
                return;
            }

            let geoJSONFeature = GeoJSONHelper.writeFeature(this._streetSelect.lastSelectedFeature);
            await GSVService.setPanoramaForFeature(geoJSONFeature);

            let processedFeature = await this._getProcessedImagesForFeature(geoJSONFeature);
            let processedFeatureProperties = getPropPath(processedFeature, ['feature', 'properties']) || getPropPath(processedFeature, ['properties'])

            this._streetSelect.lastSelectedFeature.setProperties({
                geoImages:
                    processedFeatureProperties.geoImages
            });



            UIModel.notify('getimages', { filterId: this.SelectedImageFilter.id });
            return;
        }


        let activeRegions = this.getActiveRegions();
        if (activeRegions.length === 0) {
            throw new Error(gettext("Please, select or activate a region to continue."));
        }
        let promisesFeatures = [];
        let skippedLayers = [];
        for (let regionIdx in activeRegions) {
            var region = activeRegions[regionIdx];
            /*
              Case the user simply select a region and then try to get the images
              by default the Streets from OSM will be used as source for
              sample feature. The feature to be used as sample will be by
              default "Street".
            */
            await this._collectLayersForEmptyRegions(region);//.then(() => {


            for (let layerIdx in region.layers) {
                let layer = region.layers[layerIdx];

                let features = getPropPath(layer, ['featureCollection', 'features']);
                if (!features) {
                    if (!layer.featureCollection) skippedLayers.reason = gettext("No featureCollection available!");
                    if (!layer.featureCollection.features) skippedLayers.reason = gettext("featureCollection without any features!");
                    if (!layer.featureCollection.features[0].properties.geoImages) skippedLayers.reason = gettext("features without any images. Try to collect images for this layer before requesting them to be processed.");
                    //if (GeoImageCollection.isFiltered(layer.featureCollection.features[0].properties.geoImages, this.SelectedImageFilter.id)) skippedLayer.reason = gettext("This layer already has the requested processed images.");
                    skippedLayers.push(skippedLayers);
                    continue;
                }


                for (let featureIdx in features) {
                    let promise = new Promise(async function (resolve, reject) {
                        try {
                            let featureId = features[featureIdx];
                            let olFeature = this.featuresByLayerId[layer.layerId.toString()][featureId].feature;
                            let geoJSONFeature = GeoJSONHelper.writeFeature(olFeature);

                            if (!geoJSONFeature.properties.geoImages) {
                                await this.getImages();
                                olFeature = this.featuresByLayerId[layer.layerId.toString()][featureId].feature;
                                geoJSONFeature = GeoJSONHelper.writeFeature(olFeature);
                            }

                            let processedFeature = await this._getProcessedImagesForFeature(geoJSONFeature);

                            olFeature.setProperties({
                                geoImages:
                                    processedFeature.properties.geoImages
                            });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }.bind(this));
                    promisesFeatures.push(promise);
                }
            }
            await Promise.all(promisesFeatures).then(function () {
                UIModel.notify('getimages', { filterId: this.SelectedImageFilter.id });
            }.bind(this));
            if (skippedLayers.length > 0) {
                let warnSkippedMessage = gettext("The following layers were skipped: \n");
                for (let skippedLayerIdx in skippedLayers) {
                    let skippedLayer = skippedLayers[skippedLayerIdx];
                    warnSkippedMessage += gettext("Layer: ") + skippedLayer.layerId + "."
                        + gettext(" From region: ") + skippedLayer.regionName + "."
                        + gettext(" Reason: ") + skippedLayer.reason + "\n";
                }
                alert(warnSkippedMessage);
            }
        }
        if (noCalls) return;
    }

    /**
     * Serialize uiModel to be saved
     * as part of the userSession
     * @todo Create a function out of UIModel to aggregate all components' data 
     */
    saveToJSON() {
        try {
            let regions = {}; /* Regions data for tracking */
            for (let regionId in this.regions) {
                regions[regionId] = this.regions[regionId].saveToJSON();
            }
            let featuresByLayerId = {};
            for (let layerId in this.featuresByLayerId) {
                if (!featuresByLayerId[layerId]) {
                    featuresByLayerId[layerId] = {};
                }
                for (let featureRegionId in this.featuresByLayerId[layerId]) {
                    featuresByLayerId[layerId][featureRegionId]
                        = this.featuresByLayerId[layerId][featureRegionId].saveToJSON();
                }
            }
            let uiModelSession = {
                regions: regions,
                featuresByLayerId: featuresByLayerId
            };
            return uiModelSession;
        } catch (error) {
            console.error(error);
        }
    }

    clear() {
        this._regions = {};
        this._featuresByLayerId = {};
        this._currentSessionName = "";
        this.updateRegionsDiv();
    }

    /** 
     * @todo Treat possible exceptions
     * **/
    loadFromJSON(uiModelSession) {
        try {
            if (typeof session === "string") session = JSON.parse(session);

            this._openLayersHandler.globalVectorSource.clear();
            this._featuresByLayerId = {};
            for (let regionId in uiModelSession.regions) {
                let sessionRegion = uiModelSession.regions[regionId];
                let region = this.createRegion(
                    uiModelSession.regions[regionId].boundaries,
                    sessionRegion.active,
                    sessionRegion.name,
                    sessionRegion.id);
                region.loadFromJSON(uiModelSession.regions[regionId]);
            }
            if (uiModelSession.featuresByLayerId) {
                for (let layerId in uiModelSession.featuresByLayerId) {
                    if (!this._featuresByLayerId[layerId]) {
                        this._featuresByLayerId[layerId] = {};
                    }
                    for (let featureRegionId in uiModelSession.featuresByLayerId[layerId]) {
                        let featureRegion =
                            FeatureRegions.createFromJSON(
                                uiModelSession.featuresByLayerId[layerId][featureRegionId]);
                        this._featuresByLayerId[layerId][featureRegionId] = featureRegion;
                        UIModel.notify('featurecreated', {
                            layerId: layerId,
                            featureId: featureRegionId
                        });
                    }
                }

            }

            if (uiModelSession.geoImageManager) {
                this._geoImageManager.loadFromJSON(uiModelSession.geoImageManager);
            }
        } finally {

        }


    }

    /**
     * 
     * @param {Region} region - Region object that will have features collected for
     * @param {GeoJson} geoJsonFeatures - GeoJson object that specifies the boundaries of the region
     * @param {LayerId} layerId - Defines which GIS and which feature should be collected
     * @returns {Promise} - Data will be a GeoJson
     */
    async getMapMinerFeatures(region, geoJsonFeatures, layerId) {
        //return new Promise(function (resolve) {
        //let that = this; /* window */
        return await $.ajax
            (
                "/getmapminerfeatures/",
                {
                    method: 'POST',
                    data: JSON.stringify({
                        "mapMinerId": layerId.MapMiner.id,
                        "featureName": layerId.Feature.id,
                        "regions": JSON.stringify(geoJsonFeatures),
                    }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        return data;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        throw new Error(`${errorThrown}: ${jqXHR.responseText}`)
                        //reject(errorThrown);
                    },
                });
    }


    /**
     * Represents an Image Provider
     * @typedef {ImageProvider}
     * @property {string} name - The name of the image provider used for displaying
     */

    /**
     * Calls server's "getimageproviders" GET endpoint for collecting available
     * image providers
     * @returns {Promise} resolve with an ImageProvider[] object array (with ImageProviderIds as keys) and rejects with the errorThrown string.
     */
    async getImageProviders() {
        return await $.ajax("/getimageproviders/",
            {
                cache: false,
                method: "GET",
                context: this,
                success: function (data, textStatus, jqXHR) {
                    this._imageProviders = data;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                },
                dataType: "json"
            });
    }

    /**
     * Represents a MapMiner and its respective features
     * @typedef {MapMiner}
     * @property {string} name - The name of the map miner used for displaying
     * @property {string[]} features - The array of the features' names available from this map miner
     */

    /**
     * Calls server's "getavailablemapminers" GET endpoint for collecting available
     * map miners and its respective features
     * @returns {Promise} resolve with a MapMiner[] object array (with mapMinerIds as keys) and rejects with the errorThrown string.
     */
    async getMapMinersAndFeatures() {
        return await $.ajax("/getavailablemapminers/",
            {
                cache: false,
                method: "GET",
                context: this,
                success: function (data, textStatus, jqXHR) {
                    this._mapMinersAndFeatures = data;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                },
                dataType: "json"
            });
    }

    /**
     * Represents an Image Filter
     * @typedef {ImageFilter}
     * @property {string} name - The name of the image filter used for displaying
     */

    /**
     * Calls server's "getimagefilter" GET endpoint for collecting available
     * image filters
     * @returns {Promise} resolve with an ImageFilter[] object array (with ImageFilters' Ids as keys) and rejects with the errorThrown string.
     */
    async getImageFilters() {
        return await $.ajax("/getimagefilters/",
            {
                cache: false,
                method: "GET",
                context: this,
                success: function (data, textStatus, jqXHR) {
                    this._imageFilters = data;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    throw new Error(`${errorThrown}: ${jqXHR.responseText}`);
                },
                dataType: "json"
            });
    }

    /**
     * All active layers from getActiveLayers() with geoImagesLoaded set to true are displayingLayers
     * and contains GeoImages to be displayed.
     */
    getDisplayingLayers() {
        let displayingLayers = [];
        let activeLayers = this.getActiveLayers();
        for (let layerIdx in activeLayers) {
            let layer = activeLayers[layerIdx];
            if (layer.geoImagesLoaded) {
                displayingLayers.push(layer);
            }
        }
        return displayingLayers;
    }

    /**
     * This function is a helper to call [UIModel._executeQuery(layerId)]{@link module:"UIModel.js"~UIModel._executeQuery}
     * in which the parameter layerId will be created based on the selected 
     * [UIModel.SelectedMapMiner]{@link module:"UIModel.js"~UIModel.SelectedMapMiner}
     * and [UIModel.SelectedMapFeature]{@link module:"UIModel.js"~UIModel.SelectedMapFeature}
     * @param {LayerId} [_layerId=null] - The kind of layer that should be queried
     *                            (e.g. "OpenStreetMap - Streets")
     * @returns {Promise} - Empty
     */
    async executeQuery(layerId = null) {
        if (layerId) return await this._executeQuery(layerId);

        if (this.SelectedMapMiner === null) {
            throw gettext("Please, select a Map Miner to continue.");
        }
        if (this.SelectedMapFeature === null) {
            throw gettext("Please, select a Feature to continue.");
        }

        return await
            this._executeQuery(
                new LayerId(this.SelectedMapMiner, this.SelectedMapFeature));
    }

    /**
     * Helper function to update a whole set of features
     * from the FeaturesByLayerId index.
     * @param {GeoJSONFeatureCollection} GeoJSONFeatureCollection 
     */
    _updateFeatureCollectionFromLayerIdIndex(GeoJSONFeatureCollection) {
        for (let fId in GeoJSONFeatureCollection.features) {
            let feature = GeoJSONFeatureCollection.features[fId];
            this._updateFeatureFromLayerIdIndex(feature);
        }
    }

    /**
     * Updates a single feature from the FeaturesByLayerId index.
     * @param {GeoJSONFeature} GeoJSONFeature - This GeoJSONFeature must
     * contain at its properties the layerId that it belongs to.
     */
    _updateFeatureFromLayerIdIndex(GeoJSONFeature) {
        let layerId = GeoJSONFeature.properties.layerId;
        if (this._featuresByLayerId[layerId.toString()][GeoJSONFeature.id]) {
            let newFeature = GeoJSONHelper.olGeoJson.readFeature(GeoJSONFeature);

            newFeature.setStyle(
                this._featuresByLayerId[layerId.toString()][GeoJSONFeature.id].feature.getStyle());

            this._featuresByLayerId[layerId.toString()][GeoJSONFeature.id].feature = newFeature;
            UIModel.notify('featureupdated', {
                layerId: layerId,
                featureId: GeoJSONFeature.id
            });
        }
        else {
            throw new Error(gettext("Invalid layerId, the GeoJSONFeature must contain at its properties the layerId that it belongs to."));
        }

    }

    /**
     * Updates the features directly in the featuresByLayersId index.
     * If the layerId doesn't exists in the index then it'll be
     * created.
     * 
     * @param {String} layerId - Layer id to be updated (e.g. "OpenStreetMap - Streets")
     * @param {GeoJSON} GeoJSONFeatureCollection - Feature collection retrieved
     * from some MapMiner
     */
    _updateFeaturesByLayerIdIndex(regionId, layerId, GeoJSONFeatureCollection) {
        if (!this._featuresByLayerId) this._featuresByLayerId = {};
        if (!this._featuresByLayerId[layerId]) this._featuresByLayerId[layerId] = {};
        let maxAbort = 1000;
        for (let idx in GeoJSONFeatureCollection.features) {
            if (maxAbort-- <= 0) 
            {
                console.warn('Too many features too be displayed!');
                break;
            }
            let feature = GeoJSONFeatureCollection.features[idx];
            feature.properties.layerId = LayerId.createFromJSON(layerId);

            // Updates the feature
            if (this._featuresByLayerId[layerId][feature.id]) {
                if (this._featuresByLayerId[layerId][feature.id].regions.indexOf(regionId) === -1) {
                    this._featuresByLayerId[layerId][feature.id].regions.push(regionId);
                }

                if (feature.geometry.type.toLowerCase().startsWith('multilinestring')) {
                    let oldFeature =
                        GeoJSONHelper.writeFeature(
                            this._featuresByLayerId[layerId.toString()][feature.id].feature);

                    if (
                        JSON.stringify(oldFeature) !==
                        JSON.stringify(feature)) {
                        this._syncFeatureProperties(oldFeature,
                            feature);
                    }

                    /*
                    If the different parts of the
                    same multilinearstring feature
                    appears in different layers
                    then they are joined together.
    
                    Notice that the merging of the features
                    are performed using its coordinates, that is,
                    they are not related to the properties of
                    the feature.
                    */
                    GeoJSONHelper.mergeInPlaceMultilineStringFeatures(
                        oldFeature,
                        feature
                    );
                }

                let newFeature = GeoJSONHelper.olGeoJson.readFeature(feature);

                newFeature.setStyle(
                    this._featuresByLayerId[layerId.toString()][feature.id].feature.getStyle());

                this._featuresByLayerId[layerId.toString()][feature.id].feature = newFeature;
                UIModel.notify('featureupdated', {
                    layerId: layerId,
                    featureId: feature.id
                });
            }
            else //Creates the feature
            {
                this._featuresByLayerId[layerId][feature.id] =
                    new FeatureRegions(
                        GeoJSONHelper.olGeoJson.readFeature(feature),
                        [regionId]
                    );
                UIModel.notify('featurecreated', {
                    layerId: layerId,
                    featureId: feature.id
                });
            }
        }

    }

    /**
     * Function used to collect map features, from the server (django backend)
     * @param {LayerId} layerId - The kind of layer that should be queried
     *                            (e.g. "OpenStreetMap - Streets")
     */
    async _executeQuery(layerId) {
        let noSelectedRegions = true;
        let noNewFeatures = true;

        const olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
        let activeRegions = this.getActiveRegions();

        for (let regionIdx in activeRegions) {
            noSelectedRegions = false;
            let region = activeRegions[regionIdx];
            let layer = getPropPath(region, ["layers", layerId.toString()]);//region.getLayerById(layerId);
            if (!layer) {
                layer = region.createLayer(layerId);
            }

            //If layer already exists and 
            //have features in this region it then 
            //no further request is needed
            if (getPropPath(layer, ['featureCollection', 'features', '0'])) continue;
            noNewFeatures = false;



            let geoJsonFeatures = olGeoJson.writeFeatureObject(region.boundaries);

            geoJsonFeatures.crs = {
                "type": "name",
                "properties": {
                    "name": "EPSG:4326"
                }
            };
            //let data = await this.getMapMinerFeatures(region, geoJsonFeatures, layerId);
            let newFeatureCollection = await this.getMapMinerFeatures(region, geoJsonFeatures, layerId);

            this._updateFeaturesByLayerIdIndex(region.id, layerId, newFeatureCollection);

            layer.featureCollection = newFeatureCollection;
            //if (layer.featureCollection.features.length === 0)
            if (newFeatureCollection.features.length === 0) {
                alert(gettext(`No ${layerId.Feature.name} were found inside the region ${region.name} using the GIS ${layerId.MapMiner.name}.`));
            }
            else {
                alert(
                    ngettext(
                        `There is ${newFeatureCollection.features.length} ${layerId.Feature.name} found for the region`,
                        `There are ${newFeatureCollection.features.length} ${layerId.Feature.name} found for the region`,
                        layer.featureCollection.features.length)
                    + `: ${region.name}.`);
            }
        }

        if (noSelectedRegions) {
            alert(gettext("No region selected. Please, select or activate a region before making the request."));
        }
        if (noNewFeatures) {
            alert(gettext("No new features inserted, displaying already found data."));
        }
    }


    /** 
    * An index for features, from all layers from all regions, grouped by layerId.
    * It's needed since the same layer (osm - Streets) may be present in multiple regions.s
    * @returns {FeatureRegions[]} A list of feature regions grouped by layer's ids
    */
    get featuresByLayerId() { return this._featuresByLayerId; }

    set featuresByLayerId(v) { throw "The featuresByLayerId property is private."; }

    /**
     * Check into the "featuresByLayerId" dictionary if these particular 
     * layer and feature belongs to some active region
     * @param {string} layerId - Layer's id
     * @param {int} featureId - Feature's id
     * @returns {Boolean} - True if the feature and layer belongs to at least 1 active region
     */
    isFeatureActive(layerId, featureId) {
        if (!this.featuresByLayerId[layerId]) return false;
        for (let regionIdx in this.featuresByLayerId[layerId][featureId].regions) {
            let regionId = this.featuresByLayerId[layerId][featureId].regions[regionIdx];
            if (this.regions[regionId].active) return true;
        }
        return false;
    }

    /**
     * Search into all active regions all the active layers
     * @returns {Layer[]} A list of all active layers
     */
    getActiveLayers() {
        let activeLayers = [];
        let activeRegions = this.getActiveRegions();
        for (let regionIdx in activeRegions) {
            const region = activeRegions[regionIdx];

            for (let layerIdx in region.layers) {
                const layer = region.layers[layerIdx];

                activeLayers.push(layer);
            }
        }
        return activeLayers;
    }

    /**
     * Search for all active regions at [UIModel.regions]{@link module:UIModel~UIModel#regions}.
     * @returns {Region[]} An array of all active regions
     */
    getActiveRegions() {
        let activeRegions = [];
        for (let regionIdx in this.regions) {
            const region = this.regions[regionIdx];
            if (!region.active) continue;
            activeRegions.push(region);
        }
        return activeRegions;
    }

    setTarget(regionsDivId) {
        this._target = $(`#${regionsDivId}`);
        this._target.addClass('list-group');
    }

    updateRegionsDiv() {
        this._target.empty();

        for (let regionIdx in this._regions) {
            let region = this._regions[regionIdx];

            let item = $(document.createElement('a'));
            item.addClass('list-group-item');
            item.addClass('list-group-item-action');
            item.addClass('active-list-item');
            item.append(region.name);
            item.on("click", region, this._regionListItemClickHandler.bind(this));
            if (region.active)
                item.addClass('active');
            this._target.append(item);
        }

    }

    _regionListItemClickHandler(event) {
        let element = $(event.target);
        element.toggleClass("active");
        let region = event.data;
        region.toggleActive();
        UIModel.notify('regionlistitemclick', region);
    }

    /**
     * Creates a region with features. This call was
     * created to be used by the "Load Shapefile" component.
     * @param {Array<Array<Array<float, float[, float]>>>} boundariesArray - Array of 2D or 3D coordinates for a Polygon
     * @param {FeatureCollection} geoJSONFeatureCollection - geoJSONFeatureCollection with features as Point objects
     * @return {Region} - The newly created region.
     */
    createCustomRegion(boundariesArray, geoJSONFeatureCollection)
    {
        let newRegion = this.createRegion(boundariesArray, true);
        let customLayerId = new LayerId("custom", "custom");
        let newLayer = newRegion.createLayer(customLayerId);
        this._updateFeaturesByLayerIdIndex(newRegion.id, customLayerId, geoJSONFeatureCollection);
        newLayer.featureCollection = geoJSONFeatureCollection;
        return newRegion;
    }

    createRegion(boundaries, active, name = null, pre_regionid = null) {
        let idNumber = getNewId();
        let regionId = (pre_regionid !== null) ? pre_regionid : 'region' + idNumber;
        while (regionId in this._regions) {
            console.warn(`regionId: '${regionId}' ` + gettext("already present in regions list!"));
            idNumber = getNewId();
            regionId = (pre_regionid !== null) ? pre_regionid : 'region' + idNumber;
        }

        name = name || `Region ${idNumber}`;
        //active default is false

        let newRegion = new Region(regionId, name, active, boundaries);

        this._regions[regionId] = newRegion;

        this.updateRegionsDiv();
        UIModel.notify('regioncreated', newRegion);
        return newRegion;

    }

    removeRegion(id) {
        if ((id in this._regions)) {
            let detetedRegion = this._regions[id];
            if (delete this._regions[id]) {
                UIModel.notify('regiondeleted', detetedRegion);
                return true;
            }
        }
        else {
            throw Error(`id: '${id}' ` + gettext("not found in regions list!"));
        }
    }

    /** 
    *  Feature collections with Polygons representing regions of interest
    */
    get regions() { return this._regions; }

    /** 
    * Feature collections with Polygons representing regions of interest
    * @param {string} regionId - The id of the region
    * @returns {Region} - The region with id = 'regionId' or 'undefined' if it doesn't exists
    */
    getRegionById(regionId) { return this._regions[regionId]; }



    /**
     * Helper function to keep the properties from
     * two features syncronized (e.g. if one has
     * properties that the other doesn't then
     * the other will have a copy of those
     * properties).
     * @param {GeoJSONFeature} feature1 
     * @param {GeoJSONFeature} feature2 
     * @todo move this to the Helpers module
     */
    _syncFeatureProperties(feature1, feature2) {
        for (let key in feature1.properties) {
            if (!feature2.properties[key]) {
                feature2.properties[key] = feature1.properties[key];
            }
        }
        for (let key in feature2.properties) {
            if (!feature1.properties[key]) {
                feature1.properties[key] = feature2.properties[key];
            }
        }
    }

    /**
     * 
     * @param {GeoJSONFeature} updatedFeature 
     * @returns {Boolean} True if the _featuresByLayerId is updated. False otherwise.
     */
    _syncAndMergeMultiFeature(updatedFeature) {
        //let featureRegionsIndex = this._featuresByLayerId[updatedFeature.properties.layerId];
        let featuresInLayer = this._featuresByLayerId[updatedFeature.properties.layerId.toString()];
        let geoJSONFeatureRegion = GeoJSONHelper.writeFeature(featuresInLayer[updatedFeature.id].feature);

        /**
         *  If the updatedFeature has updated properties
         * (e.g. processed data) with relation to the features
         * present in the features-layers index (_featuresByLayerId)
         * then the properties from the feature in the index
         * are updated, that is, replaced with the ones from updatedFeature.
         * */
        if (JSON.stringify(geoJSONFeatureRegion) !==
            JSON.stringify(updatedFeature)) {
            this._syncFeatureProperties(geoJSONFeatureRegion,
                updatedFeature);
        }
        // Otherwise nothing has to be done.
        else {
            return false;
        }

        /*
        If the different parts of the
        same multilinearstring feature
        appears in different layers
        then they are joined together.
    
        Notice that the merging of the features
        are performed using its coordinates, that is,
        they are not related to the properties of
        the feature.
        */
        GeoJSONHelper.mergeInPlaceMultilineStringFeatures(
            geoJSONFeatureRegion,
            updatedFeature
        );

        this._updateFeatureFromLayerIdIndex(updatedFeature);

        // /*
        //  * After a merge it's necessary to update other regions that also contains
        //  * the merged feature
        //  */

        // for (let auxRegionIdx in featuresInLayer[updatedFeature.id].regions)
        // {

        //     let auxRegion =
        //         this.regions[featuresInLayer[updatedFeature.id].regions[auxRegionIdx]];
        //     auxRegion
        //         .layers[updatedFeature.properties.layerId]
        //         .updateFeature(updatedFeature);
        // }

        return true;
    }

    /**
     * Updates the [featuresByLayerId]{@link module:UIModel~UIModel#featuresByLayerId} member.
     * If MultiLineString Features (e.g. streets) from different layers are merged together this method
     * triggers an [featuresmerged]{@link module:UIModel~UIModel.featuresmerged} event.
     * @param {string} layerIdStr - The id of the layer with untracked features. See [LayerId.toString]{@link module:UIModel~LayerId.toString}.
     * @fires module:UIModel~UIModel.featuresmerged
     */
    updateFeatureIndex(layerIdStr) {
        for (let regionIdx in this.regions) {
            let region = this.regions[regionIdx];

            let triggerFeaturesMerged = false;

            let layer = region.layers[layerIdStr];

            if (!layer || !layer.featureCollection) continue;
            if (!this._featuresByLayerId[layerIdStr]) {
                this._featuresByLayerId[layerIdStr] = {};
            }

            for (let featureIdx in layer.featureCollection.features) {
                let feature = layer.featureCollection.features[featureIdx];
                /**
                 * Here if the _featuresByLayerId index doesn't contain
                 * the this feature associated to the layer with
                 * id 'layerIdStr' then this entry will be created.
                 * 
                 */
                if (!this._featuresByLayerId[layerIdStr][feature.id]) {
                    this._featuresByLayerId[layerIdStr][feature.id] =
                        new FeatureRegions(feature, [region.id]);
                }
                else if (
                    this._featuresByLayerId[layerIdStr][feature.id]
                        .regions.indexOf(region.id) === -1
                ) {
                    this._featuresByLayerId[layerIdStr][feature.id].regions.push(region.id);
                }
                triggerFeaturesMerged = triggerFeaturesMerged || this._syncAndMergeMultiFeature(feature);
            }

            if (triggerFeaturesMerged) {
                UIModel.notify('featuresmerged', layer);
            }
        }
    }
}

/**
* Triggered by a mouse click event in the user interface
* @event module:UIModel~UIModel.regionlistitemclick
* @type {module:UIModel~Region}
* @property {Region} region - Indicates if this region is active or not.
* @property {boolean} region.active - Indicates if this region is active or not.
* @property {string} region.id - Indicates the id of the region [de]activated.
* @property {string} region.name - Indicates the display name of this region.
*/

/**
* Triggered when MultiLineString Features are joined together
* @event module:UIModel~UIModel#event:featuresmerged
* @type {Layer}
* @property {Layer} layer - See [Layer]{module:UIModel~Layer}
*/

/**
* Triggered when images or processed images are collected
* @event module:UIModel~UIModel#event:getimages
* @type {object | null}
* @property {string} filterId - If undefined then it's the original image
* otherwise it's an image processed by a filter whose id is filterId (e.g. greenery)
*/
if (!UIModel.init) {
    UIModel.init = true;
    UIModel.registerEventNames([
        'regionlistitemclick',
        'featurecreated',
        'featureupdated',
        'featuresmerged',
        'regioncreated',
        'regiondeleted',
        'getimages',
    ]);
}