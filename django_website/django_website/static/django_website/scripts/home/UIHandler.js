/**
* Responsible for keeping the state of the UI
* @module "UIHandler.js"
*/



/**
 * Responsible for keeping user selections.
 * @param {string} SelectedMapMiner - Selected map miner's id
 * @param {string} SelectedMapFeature - Selected map features's id
 * @param {string} SelectedImageProvider - Selected image providers' id
 * @param {ImageProvider[]} _imageProviders - The collection of Image Providers as reported by the backend
 * @param {MapMiner[]} _mapMinersAndFeatures - The collection of Map Miners and its respective features as reported by the backend
 */
class UIHandler {
    constructor() {
        this.jqimageProviderDiv = $(`#imageProviderDiv`);
        this.jqmapMinerDiv = $(`#mapMinerDiv`);
        this.jqmapFeatureDiv = $(`#mapFeatureDiv`);
        this.jqbtnCollectImages = $(`#btnCollectImages`);
        this.jqbtnImageProvider = $(`#btnImageProvider`);        
        this.jqbtnMapMiner = $(`#btnMapMiner`);
        this.jqbtnMapFeature = $(`#btnMapFeature`);

        this._SelectedMapMiner = null;
        this._SelectedMapFeature = null;
        this._SelectedImageProvider = null;

        this._imageProviders = [];
        this._mapMinersAndFeatures = [];

        this.populateImageProviderDiv();
        this.populateMapMinersAndFeaturesDivs();


        this.jqbtnExecuteQuery = $(`#btnExecuteQuery`);
        this.jqbtnExecuteQuery.on("click", function()
        {
            setLoadingText(this.jqbtnExecuteQuery);
            let unset = (() => unsetLoadingText(this.jqbtnExecuteQuery));
            this.executeQuery.bind(this)().then(unset, error => { alert(error); unset(); });
        }.bind(this));
        this.jqbtnClearSelections = $(`#btnClearSelections`);
        this.jqbtnClearSelections.on("click", this.clearSelections.bind(this));
    }

    set SelectedMapMiner(mapMinerId) {
        this._SelectedMapMiner = mapMinerId;

        this.jqbtnExecuteQuery.removeClass("hidden");
        this.jqbtnClearSelections.removeClass("hidden");
        this.jqbtnMapMiner.addClass("btn-success");
        this.jqbtnMapMiner.removeClass("btn-secondary");

        let mapMiner = this._mapMinersAndFeatures[mapMinerId];

        this.jqbtnMapMiner.html(mapMiner.name);

        if (!this.SelectedMapFeature)
        {
            this.filterFeaturesByMapMiner(mapMiner);
            if (mapMiner.features.length === 1)
            {
                this.changeMapFeature(mapMiner.features[0]);
            }
        }
    }

    set SelectedMapFeature(mapFeatureName) {
        this._SelectedMapFeature = mapFeatureName;

        this.jqbtnClearSelections.removeClass("hidden");
        this.jqbtnExecuteQuery.removeClass("hidden");

        this.jqbtnMapFeature.addClass("btn-success");
        this.jqbtnMapFeature.removeClass("btn-secondary");

        this.jqbtnMapFeature.html(mapFeatureName);

        if (!this.SelectedMapMiner)
        {
            this.filterMinersByFeatureName(mapFeatureName);
        }
    }

    set SelectedImageProvider(imageProviderId) {
        this._SelectedImageProvider = imageProviderId;

        this.jqbtnCollectImages.removeClass("hidden");
        this.jqbtnImageProvider.addClass("btn-success");
        this.jqbtnImageProvider.removeClass("btn-secondary");

        this.jqbtnImageProvider.html(this._imageProviders[imageProviderId].name);


    }

    get SelectedMapMiner() { return this._SelectedMapMiner; }
    get SelectedMapFeature() { return this._SelectedMapFeature; }
    get SelectedImageProvider() { return this._SelectedImageProvider; }

    /**
     * Creates an anchor button (<a href...>)
     * @param {string} label - The button title
     * @param {object} optValue - The parameter to be used for the click handler
     * @param {function} clickHandler - A function that receives "optValue" as parameter and is triggered when the button is clicked
     */
    create_dropDown_aButton(label, optValue, clickHandler) {
        let button = $(document.createElement('a'));
        button.addClass('dropdown-item');
        button.append(label);
        button.attr("href", "javascript:void(0);");
        button.click(null, clickHandler.bind(this, optValue));
        return button;
    }

    /**
     * Resets the state of the user selections over the Map section
     */
    clearSelections() {

        //Selection fields
        this._SelectedMapFeature = null;
        this._SelectedMapMiner = null;

        //Execution buttons
        this.jqbtnClearSelections.addClass("hidden");
        this.jqbtnExecuteQuery.addClass("hidden");

        //Selection buttons
        this.jqbtnMapMiner.html("Map Miner");
        this.jqbtnMapFeature.html("Feature");
        this.jqbtnMapMiner.addClass("btn-secondary");
        this.jqbtnMapFeature.addClass("btn-secondary");
        this.jqbtnMapMiner.removeClass("btn-success");
        this.jqbtnMapFeature.removeClass("btn-success");

        this.populateMapMinersAndFeaturesDivs();
    }

    /**
     * Update the hints over the GetImages button
     * @param {LayerId} - See [layerId]{@link module:UserSection~Layer.layerId}
     */
    //setHintLayers(layerId){
    //    //let aux = layerId.split('_');
    //    let mapMinerName = this._mapMinersAndFeatures[layerId.MapMinerId].name;//availableMapMiners[aux[0]].name;
    //    let featureName = layerId.FeatureName;//aux[1];
    //    let hintLayer = `${mapMinerName} - ${featureName}`;
    //    if (hintLayers.indexOf(hintLayer) < 0)
    //    {
    //        hintLayers.push(hintLayer);
    //    }
    //}


    updateLayersHintList() {
        let hintLayers = [];
    
        //Set active layers list tooltip
        let activeRegions = usersection.getActiveRegions();
        for (let regionIdx in activeRegions) {

            let region = activeRegions[regionIdx];
            //globalVectorSource.getFeatureById(region.id).setStyle(region.active ? selectedRegionStyle : null);
            for (const layerIdx in region.layers)
            {
                const layer = region.layers[layerIdx];
                const layerId = layer.layerId;
                //this.setHintLayers(layer.layerId);
                const mapMinerName = this._mapMinersAndFeatures[layerId.MapMinerId].name;//availableMapMiners[aux[0]].name;
                const featureName = layerId.FeatureName;//aux[1];
                let hintLayer = `${mapMinerName} - ${featureName}`;
                if (hintLayers.indexOf(hintLayer) < 0)
                {
                    hintLayers.push(hintLayer);
                }
            }
        }
        //refreshHintTitle();

        this.jqbtnCollectImages.attr('data-original-title', "Selected layers are:\n" + hintLayers.join('\n'));

        //function refreshHintTitle()
        //{
        //    //Get Images Button
        //    $('#btnCollectImages').attr('data-original-title', "Selected layers are:\n" + hintLayers.join('\n'))
        //}
    }


    /**
     * Function used to collect map features, from the server,
     * based on [UIHandler.SelectedMapMiner]{@link module:"UIHandler.js"~UIHandler.SelectedMapMiner}
     * and [UIHandler.SelectedMapFeature]{@link module:"UIHandler.js"~UIHandler.SelectedMapFeature}
     * @param {Event} event - Event object generated by clicking over the 'this.jqbtnExecuteQuery' DOMElement button.
     */
    executeQuery()
    {
        return new Promise(function(resolve, reject) {
            let noSelectedRegions = true;
            let numCalls = 0;
            try
            {
                const olGeoJson  = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
                let activeRegions = usersection.getActiveRegions();
            
                for (let regionIdx in activeRegions) {

                    let region = activeRegions[regionIdx];
                    let layerId = Layer.createLayerId(this.SelectedMapMiner, this.SelectedMapFeature);
                    let layer = region.getLayerById(layerId.toString());
                    //If layer already exists in this region it means that no further request is needed
                    if (layer) continue;
                
                    layer = region.createLayer(layerId);
                    numCalls = numCalls + 1;
                    noSelectedRegions = false;

                    if (this.SelectedMapMiner === null) {
                        reject("Please, select a Map Miner to continue.");
                    }
                    if (_UIHandler.SelectedMapFeature === null) {
                        reject("Please, select a Feature to continue.");
                    }

                    let geoJsonFeatures = olGeoJson.writeFeaturesObject([globalVectorSource.getFeatureById(region.id)]);

                    geoJsonFeatures.crs = {
                        "type": "name",
                        "properties": {
                            "name": "EPSG:4326"
                        }
                    };
                    getMapMinerFeatures(region, this.SelectedMapMiner, this.SelectedMapFeature, geoJsonFeatures)
                    .then(function(data){
                        layer.featureCollection = data;
                        numCalls = numCalls - 1;
                        if (numCalls == 0)
                        {
                            resolve();
                        }
                    }.bind(this))
                    .catch(function (err) {
                        //TODO: Set it as a reject
                        defaultAjaxErrorHandler('executeQuery', "error", err);
                    });
                }

                if (noSelectedRegions) {
                    reject("No region selected. Please, select a region to make a request.");
                }
            }
            catch(err)
            {
                //TODO: Set it as a reject
                defaultAjaxErrorHandler('executeQuery', null, err);
            }
        }.bind(this));
    }

    //#region Image Provider
    
    /**
     * Get the image providers available from the server and
     * creates <a> buttons at the "imageProviderDiv" DOMElement
     * @TODO: Set default image provider out of this function
     */
    populateImageProviderDiv() {
        if (this._imageProviders.length === 0)
        {
            this.getImageProviders()
            .then((imageProviders) => {
                this._imageProviders = imageProviders;
                this._fillImageProviderDiv();

                //TODO: Set this as a default (not hardcoded)
                this.changeImageProviderClick("gsvProvider");
            })
        .catch((error) => console.error(error));
        }
        else
        {
            this._fillImageProviderDiv();
        }
    }

    /**
     * Represents a Image Provider
     * @typedef {ImageProvider}
     * @property {string} name - The name of the image provider used for displaying
     */

    /**
     * Calls server's "getimageproviders" GET endpoint for collecting available
     * image providers
     * @returns {Promise} resolve with a ImageProvider[] object array (with ImageProviderIds as keys) and rejects with the errorThrown string.
     */
    getImageProviders() {
        return new Promise(function (resolve, reject) {
            $.ajax("/getimageproviders/",
                {
                    cache: false,
                    method: "GET",
                    success: function (data, textStatus, jqXHR) { resolve(data); },
                    error: function (jqXHR, textStatus, errorThrown) { reject(errorThrown); },
                    dataType: "json"
                });
        });
    }

    /**
     * Called when [_imageProviders]{@link module:UIHandler~_imageProviders} is loaded and
     * the Image Provider Div should be (re)loaded too.
     * @private
     */
    _fillImageProviderDiv()
    {
        this.jqimageProviderDiv.empty();
        for (const imageProviderIdx in this._imageProviders) {
            let imageProviderName = this._imageProviders[imageProviderIdx].name;
            let btnImageProvider = this.create_dropDown_aButton(imageProviderName, imageProviderIdx, this.changeImageProviderClick);
            this.jqimageProviderDiv.append(btnImageProvider);
        }
    }

    /**
     * Handler for changing image provider.
     * @param {string} imageProviderId - Id defined by backend's class ImageProvider's subclasses
     * @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     */
    changeImageProviderClick(imageProviderId) {
        this.SelectedImageProvider = imageProviderId;
    }

    //#endregion Image Provider

    //#region Map Miner and Features

    /**
     * Get the map miners and its respective features from the server and
     * creates <a> buttons at the "mapMinerDiv" and "mapFeatureDiv" DOMElements
     */
    populateMapMinersAndFeaturesDivs() {
        
        if (this._mapMinersAndFeatures.length === 0)
        {
            this.getMapMinersAndFeatures().then((mapMiners) => { 
                this._mapMinersAndFeatures = mapMiners;
                this._fillMapMinersAndFeaturesDiv();
            })
            .catch((error) => console.error(error));
        }
        else
        {
            this._fillMapMinersAndFeaturesDiv();
        }
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
                    success: function (data, textStatus, jqXHR) { resolve(data); },
                    error: function (jqXHR, textStatus, errorThrown) { reject(errorThrown); },
                    dataType: "json"
                });
        });
    }

    /**
     * Called when [_mapMinersAndFeatures]{@link module:UIHandler~_mapMinersAndFeatures} is loaded and
     * the Map Miner and Features Divs should be (re)loaded too.
     * @private
     */
    _fillMapMinersAndFeaturesDiv()
    {
        let currentMapFeatures = [];
        this.jqmapMinerDiv.empty();
        this.jqmapFeatureDiv.empty();
        for (const mapMinerId in this._mapMinersAndFeatures) {
            const mapMiner = this._mapMinersAndFeatures[mapMinerId];
            const btnMapMiner = this.create_dropDown_aButton(mapMiner.name, mapMinerId, this.changeMapMiner);
            this.jqmapMinerDiv.append(btnMapMiner);
            for (const featureIdx in mapMiner.features) {
                let featureName = mapMiner.features[featureIdx];
                if (currentMapFeatures.indexOf(featureName) !== -1) continue;
                let mapFeature = this.create_dropDown_aButton(featureName, featureName, this.changeMapFeature);
                this.jqmapFeatureDiv.append(mapFeature);
            }
        }
    }

    /**
     * Used as a handler for click events on Map Miner buttons from
     * MapMinerDiv
     * @param {string} mapMinerId - The MapMiner's id as reported by the backend
     */
    changeMapMiner(mapMinerId) {
        this.SelectedMapMiner = mapMinerId;
    }

    /**
     * Used as a handler for click events on Map Miner Feature buttons from mapFeatureDiv
     * @param {string} mapFeatureName - The Feature's name as reported by the backend
     */
    changeMapFeature(mapFeatureName) {
        this.SelectedMapFeature = mapFeatureName;
    }

    /**
     * Given a feature name it removes all the map miners from mapMinerDiv that don't contains this feature's name
     * @param {string} FeatureName - The name of the feature as reported by the backend
     */
    filterMinersByFeatureName(FeatureName) {
        this.jqmapMinerDiv.empty();
        let currentMapMiners = [];
        for (const mapMinerIdx in this._mapMinersAndFeatures) {
            let mapMiner = this._mapMinersAndFeatures[mapMinerIdx];
            if (mapMiner.features.indexOf(FeatureName) != -1) {
                let btnMapMiner = this.create_dropDown_aButton(mapMiner.name, mapMinerIdx, this.changeMapMiner);
                this.jqmapMinerDiv.append(btnMapMiner);
                currentMapMiners.push(mapMinerIdx);
            }
        }
        if (currentMapMiners.length === 1)
        {
            this.changeMapMiner(currentMapMiners[0]);
        }
    }

    /**
     * Given a MapMiner object it clears the mapFeatureDiv and fills it again only with the features
     * contained in the given MapMiner
     * @param {MapMiner} mapMiner - The MapMiner object
     * @param {string} mapMiner.name - The MapMiner name used for displaying
     * @param {string[]} mapMiner.features - The features' names contained by this MapMiner
     */
    filterFeaturesByMapMiner(mapMiner) {
        this.jqmapFeatureDiv.empty();
        for (const featureIdx in mapMiner.features) {
            let featureName = mapMiner.features[featureIdx];
            let mapFeature = this.create_dropDown_aButton(featureName, featureName, this.changeMapFeature);
            this.jqmapFeatureDiv.append(mapFeature);
        }
    }

    //#endregion Map Miner and Features



}
