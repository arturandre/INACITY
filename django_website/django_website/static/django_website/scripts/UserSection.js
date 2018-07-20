/**
 * UserSection module contains classes used by the UserSection class to keep
 * track of the application state, as the user interacts with it.
 * @module UserSection
 */

/**
 * Each layer is named after a MapMiner and a Feature
 * concatenated by an underscore.
 * Each layer contains a collection of regions 
 * named 'regions' and a list of features called featureCollection
 * with all the features collapsed into a single list.
 * Layer keeps track of vector features (e.g. Points, Lines, Polygons, ...)
 * related with some Map Miner (e.g OSM) and Geographic Feature Type (e.g. Street)
 * @param {LayerId} layerId
 * @param {string} layerId.MapMinerId - The MapMiner used to collect the features from this layer
 * @param {string} layerId.FeatureName - Feature's name as reported by the backend
 * @param {bool} active - Indicates if this layers is currently active (e.g. drawed over the map)
 */
class Layer extends Subject
{

    constructor(layerId, active)
    {
        super();

        if (!(layerId.MapMinerId && layerId.FeatureName))
        {
            throw new Error("Invalid layerId, it should have 'MapMinerId' and 'FeatureName' fields.");
        }

        this._layerId = layerId;
        this._featureCollection = null;
        this._active = !!active;
    }
    get active() { return this._active; }

    /** 
     * @param {LayerId} layerId - The LayerId object representing the MapMinerId and FeatureName displayed in this layer
     * @property {string} layerId.MapMinerId - The MapMiner used to collect the features from this layer
     * @property {string} layerId.FeatureName - Feature's name as reported by the backend
     */
    get layerId() { return this._layerId; }

    get featureCollection() { return this._featureCollection; }

    /**
     * The active property controls wheter the features should or not be rendered 
     * @acess public 
     * @fires [activechange]{@link module:UserSection~Layer#activechange}
     */
    set active(newActiveState) {
        let triggered = (newActiveState !== this._active);
        this._active = newActiveState;
        if (triggered)
        {
            Layer.notify('activechange', this);
        }
    }

    /** 
     * Represents all the geographical features (e.g. Streets) in this layer
     * @acess public 
     * @fires [featurecollectionchange]{@link module:UserSection~Layer#featurecollectionchange}
     */
    set featureCollection(newFeatureCollection)
    {
        let triggered = (this._featureCollection !== newFeatureCollection);
        
        // Keep state
        let activeState = this._featureCollection ? this._featureCollection.drawed : undefined;

        this._featureCollection = newFeatureCollection;

        // Restore state
        this._featureCollection.drawed = activeState;


        if (triggered)
        {
            Layer.notify('featurecollectionchange', this);
        }
    }
}

class LayerId
{
    constructor(mapMinerId, featureName)
    {
        this.MapMinerId = mapMinerId;
        this.FeatureName = featureName;
    }

    toString()
    {
        return this.MapMinerId + " - " + this.FeatureName;
    }
}

/**
 * Initializes a LayerId Object
 * @param {string} mapMinerId - MapMiner's Id as reported by the backend
 * @param {string} featureName - Feature's name as reported by the backend
 * @returns {LayerId} The object to represent a layer's id
 */
Layer.createLayerId = function (mapMinerId, featureName)
{
    return new LayerId(mapMinerId, featureName);
}

/** Triggered when a new set of features is assined to the [featureCollection]{@link module:UserSection~Layer#featureCollection} member.
* @event module:UserSection~Layer#featurecollectionchange
* @param {Layer}
*/
/**
* Triggered when the [active]{@link module:UserSection~Layer#active} property changes (It wont trigger if the assined value is the current value).
* @event module:UserSection~Layer#activechange
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
class Region extends Subject
{
    constructor(id, name, active)
    {
        super();
        
        
        active = typeof (active) === 'undefined' ? false : active;
        this._id = id;
        this._name = name;
        
        this._layers = {};
        
        this.active = active;
    }
    /** Creates a new Layer with the specified id
    * @param {string} id - Layer's identifier 
    * @fires [addlayer]{@link module:UserSection~Region#addlayer}
    */
    createLayer(layerId)
    {
        if (!this.getLayerById(layerId))
        {
            let newLayer = new Layer(layerId, this.active);
            this._layers[layerId.toString()] = newLayer;
            Region.notify('addlayer', newLayer);
            return newLayer;
        }
        else
        {
            throw Error(`layerId.MapMinerId: '${layerId.MapMinerId}' with FeatureName: '${layerId.FeatureName}' already present in layers list of this region (${this.name})!`);
        }
    }

    /** [De]activate a region for displaying or colleting geographical features. 
     * @fires [activechange]{@link module:UserSection~Region#activechange}
     */
    toggleActive()
    {
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
    getLayerById(id) 
    {
        for (const layerIdx in this._layers)
        {
            const layer = this._layers[layerIdx];
            if (layer.MapMinerId === id.MapMinerId && layer.FeatureName === id.FeatureName)
            {
                return layer;
            }
        }
        return null;
    }

    get active() { return this._active; }

    /**
     * @type {boolean}
     * @fires [activechange]{@link module:UserSection~Region#activechange}
     */
    set active(newState)
    {
        if (typeof (newState) !== "boolean")
            throw Error(`newState parameter type should be boolean, but is: ${typeof (newState)}`);
        let triggerActiveChange = this._active !== newState;
        this._active = newState;
        for (const layerIdx in this._layers)
        {
            this._layers[layerIdx].active = newState;
        }
        Region.notify('activechange', this);
    }
}

/** 
* Triggered by a mouse click event in the user interface
* @event module:UserSection~Region#activechange
* @type {Region}
* @property {Region} region - The region object [de]activated.
* @property {boolean} region.active - Indicates if this region is active or not.
* @property {string} region.id - Indicates the id of the region [de]activated.
* @property {string} region.name - Indicates the display name of this region.
*/
/** 
*  Triggered when a new [Layer]{@link module:UserSection~Layer} is created (through [createLayer]{@link module:UserSection~Region#createLayer}) in this region
* @event module:UserSection~Region#addlayer
* @type {Layer}
* @See [Layer]{@link module:UserSection~Layer}
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
 * @param {string[]} regions - A list of region Ids representing the regions to which this [FeatureRegions.feature]{@link module:UserSection~FeatureRegions.feature} belongs
 */
class FeatureRegions
{
    constructor(feature, regions)
    {
        this.feature = feature;
        this.regions = regions;
    }
}

/**
* Keeps track of several user inputs
* @param {div} regionsDivId - An HTML div element responsible for displaying the list of regions of interest selected by the user.
*/
class UserSection extends Subject
{
    constructor(regionsDivId)
    {
        super();
        this.setTarget(regionsDivId);

        this._regions = {};

        
        this._featuresByLayerId = {};
        
        Layer.on('featurecollectionchange', function (layer) {
            this.updateFeatureIndex(layer.layerId.toString()); /* UserSection */
        }, this);
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
     */
    isFeatureActive(layerId, featureId)
    {
        for (let regionIdx in this.featuresByLayerId[layerId][featureId].regions)
        {
            let regionId = this.featuresByLayerId[layerId][featureId].regions[regionIdx];
            if (this.regions[regionId].active) return true;
        }
        return false;
    }

    /**
     * Search into all active regions all the active layers
     * @returns {Layer[]} A list of all active layers
     */
    getActiveLayers()
    {
        let activeLayers = [];
        for (const regionIdx in this.regions)
        {
            const region = this.regions[regionIdx];
            if (!region.active) continue;

            for (const layerIdx in region.layers)
            {
                const layer = region.layers[layerIdx];
                if (!layer.active) continue;

                activeLayers.push(layer);
            }
        }
        return activeLayers;
    }

    /**
     * Search for all active regions at [UserSection.regions]{@link module:UserSection~UserSection#regions}.
     * @returns {Region[]} An array of all active regions
     */
    getActiveRegions()
    {
        let activeRegions = [];
        for (const regionIdx in this.regions)
        {
            const region = this.regions[regionIdx];
            if (!region.active) continue;
            activeRegions.push(region);
        }
        return activeRegions;
    }

    setTarget(regionsDivId)
    {
        this._target = $(`#${regionsDivId}`);
        this._target.addClass('list-group');
    }

    updateRegionsDiv()
    {
        this._target.empty();

        for (let regionIdx in this._regions)
        {
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

    _regionListItemClickHandler(event)
    {
        let element = $(event.target);
        element.toggleClass("active");
        let region = event.data;
        region.toggleActive();
        UserSection.notify('regionlistitemclick', region);
    }

    createRegion(id, name, active)
    {
        //active default is false
        if (!(id in this._regions))
        {
            let newRegion = new Region(id, name, active);
            this._regions[id] = newRegion;

            this.updateRegionsDiv();
            return newRegion;
        }
        else
        {
            throw Error(`id: '${id}' already present in regions list!`);
        }
    }

    removeRegion(id)
    {
        if ((id in this._regions))
        {
            return delete this._regions[id];
        }
        else
        {
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
    */
    getRegionById(regionId) { return this._regions[regionId]; }

    /**
     * Updates the [featuresByLayerId]{@link module:UserSection~UserSection#featuresByLayerId} member.
     * If MultiLineString Features (e.g. streets) from different layers are merged together this method
     * triggers an [featuresmerged]{@link module:UserSection~UserSection.featuresmerged} event.
     * @param {string} layerIdStr - The id of the layer with untracked features. See [LayerId.toString]{@link module:UserSection~LayerId.toString}.
     * @fires module:UserSection~UserSection.featuresmerged
     */
    updateFeatureIndex(layerIdStr)
    {
        for (let regionIdx in this.regions)
        {
            let triggerFeaturesMerged = false;
            let region = this.regions[regionIdx];
            let layer = region.layers[layerIdStr];
            if (!layer || !layer.featureCollection) continue;
            let featureRegionsIndex = this._featuresByLayerId[layerIdStr];
            if (!featureRegionsIndex) featureRegionsIndex = this._featuresByLayerId[layerIdStr] = {};
            for (let featureIdx in layer.featureCollection.features)
            {
                let feature = layer.featureCollection.features[featureIdx];
                if (!featureRegionsIndex[feature.id])
                {
                    featureRegionsIndex[feature.id] = new FeatureRegions(feature, [regionIdx]);
                }   
                else
                {
                    if (featureRegionsIndex[feature.id].feature === feature) continue;

                    /*
                    If the different parts of the same multilinearstring feature appears in different layers
                    then they are joined together
                    */
                    mergeInPlaceMultilineStringFeatures(featureRegionsIndex[feature.id].feature, feature);
                    triggerFeaturesMerged = true;
                    if (featureRegionsIndex[feature.id].regions.indexOf(regionIdx) === -1)
                    {
                        /*
                         * After a merge it's necessary to update other regions that also contains
                         * the merged feature
                         */
                        for (let regionIdxAux in featureRegionsIndex[feature.id].regions)
                        {
                            let auxRegion = this.regions[featureRegionsIndex[feature.id].regions[regionIdxAux]];
                            auxRegion.layers[layerId].featureCollection.features[featureIdx] = feature;
                        }
                        featureRegionsIndex[feature.id].regions.push(regionIdx);
                    }
                }
            }
            if (triggerFeaturesMerged)
            {
                UserSection.notify('featuresmerged', layer);
            }
        }
        

    }
}

//#region GeoJson functions TODO: Transfer them to a more appropriate place


/**
 * Auxiliar function to compare Longitude and Latitude coordinate arrays
 * @todo Transfer it to a more appropriate place
 * @param {float[]} lonLat1 - Array with 2 values
 * @param {float[]} lonLat2 - Array with 2 values
 */
function compareCoordinates(lonLat1, lonLat2)
{
    return ((lonLat1[0] === lonLat2[0]) && (lonLat1[1] === lonLat2[1]));
}

/**
 * Used for merging (in-place) the same feature present in different layers (e.g. A long street with different parts belonging to different layers)
 * @todo Transfer it to a more appropriate place
 * @param {Feature} feature1 - A MultiLineString Feature (e.g. a street)
 * @param {Feature} feature2 - A MultiLineString Feature (e.g. a street)
 */
function mergeInPlaceMultilineStringFeatures(feature1, feature2)
{
    let allLineStrings = [];
    for (let i = 0; i < feature1.geometry.coordinates.length; i++)
        allLineStrings.push(feature1.geometry.coordinates[i]);
    for (let i = 0; i < feature2.geometry.coordinates.length; i++)
        allLineStrings.push(feature2.geometry.coordinates[i]);
    let merged = false;
    while(true){
        merged = false;
        for (let i = allLineStrings.length-1; i > 0; i--)
        {
            for (let j = i-1; j >= 0; j--)
            {
                //First check if the strings are equal
                if (compareCoordinates(allLineStrings[i][0], allLineStrings[j][0])
                    &&
                    compareCoordinates(allLineStrings[i][allLineStrings[i].length -1], 
                    allLineStrings[j][allLineStrings[j].length-1])) //heads-heads and tails-tails
                {
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][0],allLineStrings[j][0])){ //heads-heads
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(0, 1);
                    allLineStrings[j] = allLineStrings[i].reverse().concat(allLineStrings[j]);
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][allLineStrings[i].length -1],
                    allLineStrings[j][allLineStrings[j].length-1])){ //tails-tails
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(allLineStrings[j].length-1, 1);
                    allLineStrings[j] = allLineStrings[j].concat(allLineStrings[i].reverse());
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][allLineStrings[i].length -1], allLineStrings[j][0])){ //tails-heads
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(0, 1);
                    allLineStrings[j] = allLineStrings[i].concat(allLineStrings[j]);
                    merged = true;
                    break;
                }
                else if (compareCoordinates(allLineStrings[i][0], allLineStrings[j][allLineStrings[j].length-1])){ //heads-tails
                    //Remove repeated element from the second list
                    allLineStrings[j].splice(allLineStrings[j].length-1, 1);
                    allLineStrings[j] = allLineStrings[j].concat(allLineStrings[i]);
                    merged = true;
                    break;
                }
            }
            if (merged){
                //debugging only
                //print("deleted: ", nodesSegList[i])
                //print("merged: ", nodesSegList[j])
                allLineStrings.splice(i, 1);
                break;
            }
        }
        if (!merged)
        {
            break;
        }
    }
    feature1.geometry.coordinates = feature2.geometry.coordinates = allLineStrings;
}

//#endregion GeoJson functions TODO: Transfer them to a more appropriate place

/**
* Triggered by a mouse click event in the user interface
* @event module:UserSection~UserSection.regionlistitemclick
* @type {module:UserSection~Region}
* @property {Region} region - Indicates if this region is active or not.
* @property {boolean} region.active - Indicates if this region is active or not.
* @property {string} region.id - Indicates the id of the region [de]activated.
* @property {string} region.name - Indicates the display name of this region.
*/

/**
* Triggered when MultiLineString Features are joined together
* @event module:UserSection~UserSection.featuresmerged
* @type {Layer}
* @property {Layer} layer - See [Layer]{module:UserSection~Layer}
*/
if (!UserSection.init) {
    UserSection.init = true;
    UserSection.registerEventNames([
    'regionlistitemclick',
    'featuresmerged',
    ]);
}