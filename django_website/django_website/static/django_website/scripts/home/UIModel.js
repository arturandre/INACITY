/**
 * UIModel module contains classes used by the UIModel class to keep
 * track of the application state, as the user interacts with it.
 * @module UIModel
 */

/**
 * Each layer is named after a MapMiner and a Feature (e.g. Streets)
 * concatenated by an underscore (e.g. osm - streets).
 * Each Layer contains a list of geographical features called featureCollection.
 * A Layer should be identified by a [LayerId]{@link LayerId} object.
 * Layer keeps track of vector features (e.g. Points, Lines, Polygons, ...)
 * related with some Map Miner (e.g OSM) and Geographic Feature Type (e.g. Street)
 * @param {LayerId} layerId - Represents an Id object for a Layer
 * @param {string} layerId.MapMinerId - The MapMiner used to collect the features from this layer
 * @param {string} layerId.FeatureName - Feature's name as reported by the backend
 * @param {bool} active - Indicates if this layers is currently active (e.g. drawed over the map)
 */
class Layer extends Subject {

    constructor(layerId, active) {
        super();

        if (!(layerId.MapMinerId && layerId.FeatureName)) {
            throw new Error("Invalid layerId, it should have 'MapMinerId' and 'FeatureName' fields.");
        }

        this._layerId = layerId;
        this._featureCollection = null;
        this._active = !!active;
        this._geoImagesLoaded = false;
    }

    saveToJSON() {
        let layerSession = {
            layerId: this._layerId.saveToJSON(),
            featureCollection: this.featureCollection,
            active: this.active,
            geoImagesLoaded: this.geoImagesLoaded
        };
        return layerSession;
    }

    static createFromJSON(layerSession) {
        let layerId = LayerId.createFromJSON(layerSession.layerId);

        let ret = new Layer(layerId, layerSession.active);

        ret.featureCollection = layerSession.featureCollection;
        ret.active = layerSession.active;
        ret.geoImagesLoaded = layerSession.geoImagesLoaded;
        return ret;
    }

    loadFromJSON(layerSession) {
        this.featureCollection = layerSession.featureCollection;
        this.active = layerSession.active;
        this.geoImagesLoaded = layerSession.geoImagesLoaded;
    }

    get active() { return this._active; }

    get geoImagesLoaded() { return this._geoImagesLoaded; }
    set geoImagesLoaded(newState) {
        let triggered = (newState !== this._geoImagesLoaded);
        this._geoImagesLoaded = newState;
        if (triggered) {
            Layer.notify('featurecollectionchange', this);
        }
    }

    /** 
     * @param {LayerId} layerId - The LayerId object representing the MapMinerId and FeatureName displayed in this layer
     * @property {string} layerId.MapMinerId - The MapMiner used to collect the features from this layer
     * @property {string} layerId.FeatureName - Feature's name as reported by the backend
     */
    get layerId() { return this._layerId; }

    get featureCollection() { return this._featureCollection; }

    /**
     * The active property controls wheter the features should or not be rendered 
     * @param {Boolean} newActiveState - New value for active attribute
     * @acess public 
     * @fires [activechange]{@link module:UIModel~Layer#activechange}
     */
    set active(newActiveState) {
        let triggered = (newActiveState !== this._active);
        this._active = newActiveState;
        if (triggered) {
            Layer.notify('activechange', this);
        }
    }

    /** 
     * Represents all the geographical features (e.g. Streets) in this layer
     * @param {FeatureCollection} newFeatureCollection - New feature collection value
     * @acess public 
     * @fires [featurecollectionchange]{@link module:UIModel~Layer#featurecollectionchange}
     */
    set featureCollection(newFeatureCollection) {
        let triggered = (this._featureCollection !== newFeatureCollection);

        // Keep state
        let activeState = this._featureCollection ? this._featureCollection.drawed : undefined;

        this._featureCollection = newFeatureCollection;

        // Restore state
        this._featureCollection.drawed = activeState;

        if (this.featureCollection.features["0"].properties.geoImages) {
            this.geoImagesLoaded = true;
        }

        if (triggered) {
            Layer.notify('featurecollectionchange', this);
        }
    }
}

class LayerId {
    constructor(mapMinerId, featureName) {
        this.MapMinerId = mapMinerId;
        this.FeatureName = featureName;
    }

    toString() {
        return this.MapMinerId + " - " + this.FeatureName;
    }

    saveToJSON() {
        let layerIdJSON = {
            MapMinerId: this.MapMinerId,
            FeatureName: this.FeatureName
        };
        return layerIdJSON;
    }

    static createFromJSON(layerIdJSON) {
        return (new LayerId(layerIdJSON.MapMinerId, layerIdJSON.FeatureName));
    }

    loadFromJSON(layerIdJSON) {
        this.MapMinerId = layerIdJSON.MapMinerId;
        this.FeatureName = layerIdJSON.FeatureName;
    }
}

/**
 * Initializes a LayerId Object
 * @param {string} mapMinerId - MapMiner's Id as reported by the backend
 * @param {string} featureName - Feature's name as reported by the backend
 * @returns {LayerId} The object to represent a layer's id
 */
Layer.createLayerId = function (mapMinerId, featureName) {
    return new LayerId(mapMinerId, featureName);
}

/** Triggered when a new set of features is assined to the [featureCollection]{@link module:UIModel~Layer#featureCollection} member.
* @event module:UIModel~Layer#featurecollectionchange
* @param {Layer}
*/
/**
* Triggered when the [active]{@link module:UIModel~Layer#active} property changes (It wont trigger if the assined value is the current value).
* @event module:UIModel~Layer#activechange
* @param {Layer}
*/
//Singleton approach
if (!Layer.init) {
    Layer.init = true;
    Layer.registerEventNames([
        'featurecollectionchange',
        'activechange',
    ]);
}

/**
* A region defines boundaries for regions of interest 
* and keeps track of geographical features collected for it.
* @param {string} id - Region identifier.
* @param {string} name - Region display name.
* @param {boolean} active - Represents if the region is in user's current selection or not.
*/
class Region extends Subject {
    constructor(id, name, active) {
        super();


        active = typeof (active) === 'undefined' ? false : active;
        this._id = id;
        this._name = name;

        this._layers = {};

        this.active = active;
    }

    saveToJSON() {
        let layersJSON = {};
        for (let layerKey in this.layers) {
            layersJSON[layerKey] = this.layers[layerKey].saveToJSON();
        }
        let regionSession = {
            id: this.id,
            name: this.name,
            active: this.active,
            boundaries: this.boundaries,
            layers: layersJSON
        };
        return regionSession;
    }

    static createFromJSON(regionSession) {
        let ret = new Region(regionSession.id, regionSession.name, regionSession.active);

        for (let layerKey in regionSession.layers) {
            ret[layerKey] = Layer.createFromJSON(regionSession.layers[layerKey]);
        }
        return ret;
    }

    loadFromJSON(regionSession) {
        for (let layerKey in regionSession.layers) {
            let layerSession = regionSession.layers[layerKey];
            let layerId = LayerId.createFromJSON(layerSession.layerId);
            let layer = this.createLayer(layerId);
            layer.loadFromJSON(layerSession);

            //this.layers[layerKey] = Layer.createFromJSON(regionSession.layers[layerKey]);
        }
    }

    /** Creates a new Layer with the specified id
    * @param {LayerId} layerId - Layer's identifier
    * @returns {Layer} - A new instance of Layer
    * @fires [addlayer]{@link module:UIModel~Region#addlayer}
    */
    createLayer(layerId) {
        if (!this.getLayerById(layerId)) {
            let newLayer = new Layer(layerId, this.active);
            this._layers[layerId.toString()] = newLayer;
            Region.notify('addlayer', newLayer);
            return newLayer;
        }
        else {
            throw Error(`layerId.MapMinerId: '${layerId.MapMinerId}' with FeatureName: '${layerId.FeatureName}' already present in layers list of this region (${this.name})!`);
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

    getActiveLayers() {
        let activeLayers = [];
        for (let layerIdx in this._layers) {
            const layer = this._layers[layerIdx];
            if (layer.active) {
                activeLayers.push(layer);
            }
        }
        return activeLayers;
    }

    getLayerById(id) {
        for (let layerIdx in this._layers) {
            const layerId = this._layers[layerIdx].layerId;
            if (layerId.MapMinerId === id.MapMinerId && layerId.FeatureName === id.FeatureName) {
                return layerId;
            }
        }
        return null;
    }

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
        for (let layerIdx in this._layers) {
            this._layers[layerIdx].active = newState;
        }
        Region.notify('activechange', this);
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
}

/**
* Keeps track of several user inputs
* @param {div} regionsDivId - An HTML div element responsible for displaying the list of regions of interest selected by the user.
*/
class UIModel extends Subject {
    constructor(regionsDivId, defaults) {
        super();
        this.setTarget(regionsDivId);

        this._regions = {};
        this._featuresByLayerId = {};

        this._imageProviders = [];
        this._imageFilters = [];
        this._mapMinersAndFeatures = [];


        if (defaults) {
            this.mapMiner = defaults.mapMiner;
            this.mapFeature = defaults.mapFeature;
        }

    }

    /**
     * Collects images' providers and filters and maps' miners and features.
     * @returns {Promise} - All the providers as registered at server's side
     */
    initialize() {
        let getServerDataPromises = Promise.all([this.getImageProviders(), this.getMapMinersAndFeatures(), this.getImageFilters()]);

        return getServerDataPromises;
    }

    get imageProviders() { return this._imageProviders; }
    get imageFilters() { return this._imageFilters; }
    get mapMinersAndFeatures() { return this._mapMinersAndFeatures; }

    async getImages(selectedImageProvider) {
        return new Promise(function (resolve, reject) {
            let numCalls = 0;
            try {
                let activeRegions = this.getActiveRegions();
                if (activeRegions.length === 0) {
                    return reject("Please, select region to continue.");
                }
                for (let regionIdx in activeRegions) {
                    var region = activeRegions[regionIdx];
                    (new Promise(function (resolve) {
                        /*
                          Case the user simply select a region and then try to get the images
                          by default the Streets from OSM will be used as features
                        */
                        if (Object.keys(region.layers).length === 0) {
                            this.executeQuery(this.mapMiner, this.mapFeature).then(() => resolve());
                        }
                        else {
                            //Otherwise simply collect the image's from the feature selected
                            return resolve();
                        }
                    }.bind(this))).then(async () => {
                        let activeLayers = region.getActiveLayers();

                        for (let layerIdx in activeLayers) {
                            let layer = activeLayers[layerIdx];

                            //A layer without a FeatuerCollection, or with an empty FeatureCollection or that already got images will be skipped
                            //@todo: Warn user about the skipped layers
                            //@todo: Revise this
                            if (!layer.featureCollection || !layer.featureCollection.features || layer.featureCollection.features[0].properties.geoImages) {
                                console.warn(`Layer '${layer.layerId}' without features or already fulfilled.`);
                                continue;
                            }

                            numCalls += 1;
                            await GSVService.setPanoramaForFeatureCollection(layer.featureCollection);
                            layer.geoImagesLoaded = true;
                            numCalls -= 1;
                            if (numCalls === 0) {
                                return resolve();
                            }
                        }
                    });
                }
            }
            catch (err) {

                throw err;
            }
        }.bind(this));
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
     */
    getProcessedImages(selectedImageFilter) {
        return new Promise(function (resolve, reject) {
            let numCalls = 0;
            try {
                let activeRegions = this.getActiveRegions();
                if (activeRegions.length === 0) {
                    return reject("Please, select region to continue.");
                }
                for (let regionIdx in activeRegions) {
                    var region = activeRegions[regionIdx];
                    (new Promise(function (resolve) {
                        /*
                          Case the user simply select a region and then try to get the images
                          by default the Streets from OSM will be used as features
                        */
                        if (Object.keys(region.layers).length === 0) {
                            this.executeQuery(this.mapMiner, this.mapFeature).then(() => resolve());
                        }
                        else {
                            //Otherwise simply collect the image's from the feature selected
                            return resolve();
                        }
                    }.bind(this))).then(() => {
                        let activeLayers = region.getActiveLayers();

                        for (let layerIdx in activeLayers) {
                            let layer = activeLayers[layerIdx];

                            //A layer without a FeatuerCollection, or with an empty FeatureCollection or that already got images will be skipped
                            //@todo: Warn user about the skipped layers
                            //@todo: Revise this
                            if (!layer.featureCollection || !layer.featureCollection.features || !layer.featureCollection.features[0].properties.geoImages) {
                                console.warn(`Layer '${layer.layerId}' without features or without images. Try to get the images first.`);
                                continue;
                            }

                            numCalls += 1;

                            $.ajax('/processimagesfromfeaturecollection/',
                                {
                                    method: 'POST',
                                    processData: false,
                                    data: JSON.stringify({
                                        'imageFilterId': selectedImageFilter,
                                        'featureCollection': JSON.stringify(layer.featureCollection),
                                        'regionId': region.id,
                                        'layerId': layer.layerId.toString()
                                    }),
                                    contentType: "application/json; charset=utf-8",
                                    dataType: 'json',
                                    success: function (data, textStatus, jqXHR) {
                                        //Associate the featureCollection from layerId from regionId to the returned data's 'featureCollection' 
                                        let layer = this.regions[data['regionId']].layers[data['layerId']];
                                        layer.featureCollection = data['featureCollection'];
                                    }.bind(this),
                                    error: function (jqXHR, textStatus, errorThrown) {
                                        //@todo: Create a error handling mechanism
                                        if (jqXHR.status === 413) {
                                            alert("The request was too big to be processed. Try a smaller region.");
                                        }
                                        else {
                                            defaultAjaxErrorHandler('getProcessedImages', textStatus, errorThrown);
                                        }
                                    },
                                    complete: function (jqXHR, textStatus) {
                                        /**
                                        @todo: Treat parcial returns, the user should be able to see the results
                                        as they are being received, rather than wait all of them.
                                        */
                                        numCalls -= 1;
                                        if (numCalls === 0) {
                                            return resolve();
                                        }
                                    },
                                },
                                'json'
                            );
                        }
                    });
                }
            }
            catch (err) {

                throw err;
            }
        }.bind(this));
    }

    saveToJSON() {
        const olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });

        //let featuresByLayerId = null; /* Features data for tracking */
        let regions = {}; /* Regions data for tracking */
        let openLayersFeatures = {}; /*OpenLayers features for drawing*/
        //featuresByLayerId = this.featuresByLayerId;

        for (let regionId in this.regions) {
            let geoJsonFeatures = olGeoJson.writeFeaturesObject([globalVectorSource.getFeatureById(regionId)]);
            openLayersFeatures[regionId] = geoJsonFeatures;
            regions[regionId] = this.regions[regionId].saveToJSON();
        }
        let session = {
            //featuresByLayerId: featuresByLayerId,
            regions: regions,
            openLayersFeatures: openLayersFeatures
        };
        return session;
    }

    /** 
     * @todo Treat possible exceptions
     * **/
    loadFromJSON(session) {
        const olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
        if (typeof session === "string") session = JSON.parse(session);

        globalVectorSource.clear();
        for (let regionId in session.regions) {
            //  let geoJsonFeatures = olGeoJson.readFeatures(
            //      session.openLayersFeatures[regionId],{featureProjection: featureCollection.crs.properties.name});
            let geoJsonFeatures = olGeoJson.readFeatures(session.openLayersFeatures[regionId]);
            globalVectorSource.addFeatures(geoJsonFeatures);
            let region = this.createRegion(
                olGeoJson.readFeature(session.regions[regionId].boundaries),
                session.regions[regionId].active);
            region.loadFromJSON(session.regions[regionId]);
            //this.regions[regionId] = Region.createFromJSON(session.regions[regionId]);
        }

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
    getImageProviders() {
        return new Promise(function (resolve, reject) {
            $.ajax("/getimageproviders/",
                {
                    cache: false,
                    method: "GET",
                    success: function (data, textStatus, jqXHR) {
                        this._imageProviders = data;
                        resolve();
                    }.bind(this),
                    error: function (jqXHR, textStatus, errorThrown) { reject(errorThrown); },
                    dataType: "json"
                });
        }.bind(this));
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
    getMapMinersAndFeatures() {
        return new Promise(function (resolve, reject) {
            $.ajax("/getavailablemapminers/",
                {
                    cache: false,
                    method: "GET",
                    success: function (data, textStatus, jqXHR) {
                        this._mapMinersAndFeatures = data;
                        resolve();
                    }.bind(this),
                    error: function (jqXHR, textStatus, errorThrown) { reject(errorThrown); },
                    dataType: "json"
                });
        }.bind(this));
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
    getImageFilters() {
        return new Promise(function (resolve, reject) {
            $.ajax("/getimagefilters/",
                {
                    cache: false,
                    method: "GET",
                    success: function (data, textStatus, jqXHR) {
                        this._imageFilters = data;
                        resolve();
                    }.bind(this),
                    error: function (jqXHR, textStatus, errorThrown) { reject(errorThrown); },
                    dataType: "json"
                });
        }.bind(this));
    }

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
     * Function used to collect map features, from the server,
     * based on [UIView.SelectedMapMiner]{@link module:"UIView.js"~UIView.SelectedMapMiner}
     * and [UIView.SelectedMapFeature]{@link module:"UIView.js"~UIView.SelectedMapFeature}
     * @param {string} selectedMapMiner - Map miner used to search for features (i.e. OpenStreetMap)
     * @param {string} selectedMapFeature - Which kind of feature should be fetched
     * @returns {Promise} - Empty
     */
    executeQuery(selectedMapMiner, selectedMapFeature) {
        return new Promise(function (resolve, reject) {
            let noSelectedRegions = true;
            let numCalls = 0;
            try {
                const olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
                let activeRegions = this.getActiveRegions();

                for (let regionIdx in activeRegions) {

                    let region = activeRegions[regionIdx];
                    let layerId = Layer.createLayerId(selectedMapMiner, selectedMapFeature);
                    let layer = region.getLayerById(layerId);
                    //If layer already exists in this region it means that no further request is needed
                    if (layer) continue;

                    layer = region.createLayer(layerId);
                    numCalls = numCalls + 1;
                    noSelectedRegions = false;

                    if (selectedMapMiner === null) {
                        return reject("Please, select a Map Miner to continue.");
                    }
                    if (selectedMapFeature === null) {
                        return reject("Please, select a Feature to continue.");
                    }

                    let geoJsonFeatures = olGeoJson.writeFeaturesObject([globalVectorSource.getFeatureById(region.id)]);

                    geoJsonFeatures.crs = {
                        "type": "name",
                        "properties": {
                            "name": "EPSG:4326"
                        }
                    };
                    getMapMinerFeatures(region, selectedMapMiner, selectedMapFeature, geoJsonFeatures)
                        .then(function (data) {
                            layer.featureCollection = data;
                            numCalls = numCalls - 1;
                            if (numCalls === 0) {
                                return resolve();
                            }
                        }.bind(this))
                        .catch(function (err) {
                            //TODO: Set it as a reject
                            defaultAjaxErrorHandler('executeQuery', "error", err);
                        });
                }

                if (noSelectedRegions) {
                    return reject("No region selected. Please, select a region to make a request.");
                }
            }
            catch (err) {
                //TODO: Set it as a reject
                defaultAjaxErrorHandler('executeQuery', null, err);
            }
        }.bind(this));
    }

    /** 
    * An index for features, from all layers from all regions, grouped by layerId
    * @returns {FeatureRegions[]} A list of feature regions grouped by layer's ids
    */
    get featuresByLayerId() { return this._featuresByLayerId; }

    /**
     * Check into the "featuresByLayerId" dictionary if these particular 
     * layer and feature belongs to some active region
     * @param {string} layerId - Layer's id
     * @param {int} featureId - Feature's id
     * @returns {Boolean} - True if the feature and layer belongs to at least 1 active region
     */
    isFeatureActive(layerId, featureId) {
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
        for (let regionIdx in this.regions) {
            const region = this.regions[regionIdx];
            if (!region.active) continue;

            for (let layerIdx in region.layers) {
                const layer = region.layers[layerIdx];
                if (!layer.active) continue;

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

    createRegion(feature, active, name=null) {
        const olGeoJson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });

        let idNumber = getNewId();
        let regionId = 'region' + idNumber;

        feature.setId(regionId);
        feature.setProperties({ 'type': 'region' });
        feature.setStyle(active ? selectedRegionStyle : null);

        name = name || `Region ${idNumber}`;
        //active default is false
        if (!(regionId in this._regions)) {
            let newRegion = new Region(regionId, name, active);
            newRegion.boundaries = olGeoJson.writeFeature(feature);
            this._regions[regionId] = newRegion;

            Region.on('activechange', function (region) {
                globalVectorSource.getFeatureById(region.id).setStyle(region.active ? selectedRegionStyle : null);
                if (region.active) {
                    for (let layerIdx in region.layers) {
                        let layer = region.layers[layerIdx];
                        //drawLayer@home.js
                        uiView.drawLayer(layer);
                    }
                }
                else {
                    for (let layerIdx in region.layers) {
                        let layer = region.layers[layerIdx];
                        //removeLayer@home.js
                        uiView.removeLayer(layer);
                    }
                }
            }.bind(null, newRegion));

            this.updateRegionsDiv();
            return newRegion;
        }
        else {
            throw Error(`id: '${id}' already present in regions list!`);
        }
    }

    removeRegion(id) {
        if ((id in this._regions)) {
            return delete this._regions[id];
        }
        else {
            throw Error(`id: '${id}' not found in regions list!`);
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
     * Updates the [featuresByLayerId]{@link module:UIModel~UIModel#featuresByLayerId} member.
     * If MultiLineString Features (e.g. streets) from different layers are merged together this method
     * triggers an [featuresmerged]{@link module:UIModel~UIModel.featuresmerged} event.
     * @param {string} layerIdStr - The id of the layer with untracked features. See [LayerId.toString]{@link module:UIModel~LayerId.toString}.
     * @fires module:UIModel~UIModel.featuresmerged
     */
    updateFeatureIndex(layerIdStr) {
        let activeRegions = this.getActiveRegions();
        for (let regionIdx in activeRegions) {
            let region = activeRegions[regionIdx];

            let triggerFeaturesMerged = false;

            let layer = region.layers[layerIdStr];

            if (!layer || !layer.featureCollection) continue;
            let featureRegionsIndex = this._featuresByLayerId[layerIdStr];
            if (!featureRegionsIndex) featureRegionsIndex = this._featuresByLayerId[layerIdStr] = {};
            for (let featureIdx in layer.featureCollection.features) {
                let feature = layer.featureCollection.features[featureIdx];
                if (!featureRegionsIndex[feature.id]) {
                    featureRegionsIndex[feature.id] = new FeatureRegions(feature, [region.id]);
                }
                else {
                    if (featureRegionsIndex[feature.id].feature === feature) continue;

                    /*
                    If the different parts of the same multilinearstring feature appears in different layers
                    then they are joined together
                    */
                    mergeInPlaceMultilineStringFeatures(featureRegionsIndex[feature.id].feature, feature);
                    triggerFeaturesMerged = true;
                    if (featureRegionsIndex[feature.id].regions.indexOf(region.id) === -1) {
                        /*
                         * After a merge it's necessary to update other regions that also contains
                         * the merged feature
                         */
                        for (let regionIdxAux in featureRegionsIndex[feature.id].regions) {
                            let auxRegion = this.regions[featureRegionsIndex[feature.id].regions[regionIdxAux]];
                            auxRegion.layers[layerIdStr].featureCollection.features[featureIdx] = feature;
                        }
                        featureRegionsIndex[feature.id].regions.push(region.id);
                    }
                }
            }
            if (triggerFeaturesMerged) {
                UIModel.notify('featuresmerged', layer);
            }
        }


    }
}


//#region GeoJson functions
/**
 * @todo Transfer the 'GeoJson functions region' to a more appropriate place
 */

/**
 * Auxiliar function to compare Longitude and Latitude coordinate arrays
 * @todo Transfer it to a more appropriate place
 * @param {float[]} lonLat1 - Array with 2 values
 * @param {float[]} lonLat2 - Array with 2 values
 * @returns {Boolean} - True if both coordinates have the same values
 */
function compareCoordinates(lonLat1, lonLat2) {
    return ((lonLat1[0] === lonLat2[0]) && (lonLat1[1] === lonLat2[1]));
}

/**
 * Used for merging (in-place) the same feature present in different layers (e.g. A long street with different parts belonging to different layers)
 * @todo Transfer it to a more appropriate place
 * @param {Feature} feature1 - A MultiLineString Feature (e.g. a street)
 * @param {Feature} feature2 - A MultiLineString Feature (e.g. a street)
 */
function mergeInPlaceMultilineStringFeatures(feature1, feature2) {
    let allLineStrings = [];
    for (let i = 0; i < feature1.geometry.coordinates.length; i++)
        allLineStrings.push(feature1.geometry.coordinates[i]);
    for (let i = 0; i < feature2.geometry.coordinates.length; i++)
        allLineStrings.push(feature2.geometry.coordinates[i]);
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = allLineStrings.length - 1; i > 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                //First check if the strings are equal
                if (compareCoordinates(allLineStrings[i][0], allLineStrings[j][0])
                    &&
                    compareCoordinates(allLineStrings[i][allLineStrings[i].length - 1],
                        allLineStrings[j][allLineStrings[j].length - 1])) //heads-heads and tails-tails
                {
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][0], allLineStrings[j][0])) { //heads-heads
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(0, 1);
                    allLineStrings[j] = allLineStrings[i].reverse().concat(allLineStrings[j]);
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][allLineStrings[i].length - 1],
                    allLineStrings[j][allLineStrings[j].length - 1])) { //tails-tails
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(allLineStrings[j].length - 1, 1);
                    allLineStrings[j] = allLineStrings[j].concat(allLineStrings[i].reverse());
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][allLineStrings[i].length - 1], allLineStrings[j][0])) { //tails-heads
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(0, 1);
                    allLineStrings[j] = allLineStrings[i].concat(allLineStrings[j]);
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][0], allLineStrings[j][allLineStrings[j].length - 1])) { //heads-tails
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(allLineStrings[j].length - 1, 1);
                    allLineStrings[j] = allLineStrings[j].concat(allLineStrings[i]);
                    merged = true;
                    break;
                }
            }
            if (merged) {
                //debugging only
                //print("deleted: ", nodesSegList[i])
                //print("merged: ", nodesSegList[j])
                allLineStrings.splice(i, 1);
                break;
            }
        }
        //if (!merged) {
        //    break;
        //}
    }
    feature1.geometry.coordinates = feature2.geometry.coordinates = allLineStrings;
}

//#endregion GeoJson functions TODO: Transfer them to a more appropriate place

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
* @event module:UIModel~UIModel.featuresmerged
* @type {Layer}
* @property {Layer} layer - See [Layer]{module:UIModel~Layer}
*/
if (!UIModel.init) {
    UIModel.init = true;
    UIModel.registerEventNames([
        'regionlistitemclick',
        'featuresmerged',
    ]);
}