/**
* Responsible for keeping the state of the UI
* @module "UIHandler.js"
*/

class DrawTool
{
    constructor(DrawToolName, geoFunction)
    {
        if (DrawTool.isNameValid(DrawToolName))
        {
            this.name = DrawToolName;
            this.geometryFunction = geoFunction;
        }
        else
        {
            throw Error(`Invalid DrawToolName: ${DrawToolName}`);
        }
    }
}

if (!DrawTool.init)
{
    DrawTool.init = true;
    DrawTool.validNames = 
        [
            'Box',
            'Square',
            'Dodecagon'
        ];
    DrawTool.isNameValid = function (name)
    {
        return (DrawTool.validNames.indexOf(name) >= 0);
    }
}


/**
 * Responsible for keeping user selections.
 * @param {string} SelectedMapMiner - Selected map miner's id
 * @param {string} SelectedMapFeature - Selected map features's id
 * @param {string} SelectedImageProvider - Selected image providers' id
 * @param {ImageProvider[]} _imageProviders - The collection of Image Providers as reported by the backend
 * @param {MapMiner[]} _mapMinersAndFeatures - The collection of Map Miners and its respective features as reported by the backend
 */
class UIHandler {
    constructor(defaults) {
        this.jqimageProviderDiv = $(`#imageProviderDiv`);
        this.jqmapMinerDiv = $(`#mapMinerDiv`);
        this.jqmapFeatureDiv = $(`#mapFeatureDiv`);
        this.jqshapeSelectorDiv = $(`#shapeSelectorDiv`);
        this.jqmapProviderDiv = $(`#mapProviderDiv`);
        
        this.jqbtnCollectImages = $(`#btnCollectImages`);
        this.jqbtnImageProvider = $(`#btnImageProvider`);        
        this.jqbtnMapMiner = $(`#btnMapMiner`);
        this.jqbtnMapFeature = $(`#btnMapFeature`);

        this.jqbtnMapProvider = $(`#btnMapProvider`);
        
        this.jqbtnCancelDrawing = $(`#btnCancelDrawing`);
        this.jqbtnShapeSelector = $(`#btnShapeSelector`);

        this._SelectedMapMiner = null;
        this._SelectedMapFeature = null;
        this._SelectedImageProvider = null;

        this._SelectedMapProvider = null;
        
        this._SelectedDrawTool = null;
        this._drawInteraction = null;

        this._imageProviders = [];
        this._mapMinersAndFeatures = [];

        this.populateShapeDiv();
        this.populateMapProviderDiv();

        
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
        this.jqbtnCancelDrawing.on("click", this.cancelDrawing.bind(this));

        if (defaults) 
        {
            this.setDefaults(defaults);
        }
    }

    setDefaults(defaults)
    {
        if (defaults.shape)
        {
            this.changeShapeClick(defaults.shape);
        }
        if (defaults.tileProvider)
        {
            this.changeMapProviderClick(defaults.tileProvider);
        }

    }

    set SelectedMapProvider(tileProvider)
    {
        this._SelectedMapProvider = tileProvider;

        this.setLabelSelectionBtn(this.jqbtnMapProvider, tileProvider.name, false);
    }

    get SelectedMapProvider() { return this._SelectedMapProvider; }

    set SelectedDrawTool(drawTool)
    {
        this._SelectedDrawTool = drawTool;
        
        this.setLabelSelectionBtn(this.jqbtnShapeSelector, drawTool.name, false);
    }

    populateMapProviderDiv()
    {
        for (let tileProviderId in OpenLayersHandler.TileProviders)
        {
            const tileProvider = OpenLayersHandler.TileProviders[tileProviderId];
            this.jqmapProviderDiv.append(create_dropDown_aButton(tileProvider.name, tileProvider, this.changeMapProviderClick.bind(this)));
        };
    }

    setLabelSelectionBtn(jqselectorButton, label, deselected)
    {
        if (deselected)
        {
            jqselectorButton.removeClass("btn-success");
            jqselectorButton.addClass("btn-secondary");
        }
        else
        {
            jqselectorButton.addClass("btn-success");
            jqselectorButton.removeClass("btn-secondary");
        }
        jqselectorButton.html(label);
    }

    /**
    * Handler for changing map tiles.
    * @param {string} mapProviderId - Id defined by OpenLayers to set a tile provider
    * @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
    */
    changeMapProviderClick(tileProvider) {
        this.SelectedMapProvider = tileProvider;
        openLayersHandler.changeMapProvider(tileProvider.provider);
    }

    cancelDrawing()
    {
        this._SelectedDrawTool = null;

        if(this._drawInteraction)
        {
            openLayersHandler.map.removeInteraction(this._drawInteraction);
            this._drawInteraction = null;
        }

        this.setLabelSelectionBtn(this.jqbtnShapeSelector, "Shape", true);
        
        this.jqbtnCancelDrawing.addClass("hidden");

    }

    get SelectedDrawTool(){ return this._SelectedDrawTool; }


    changeShapeClick(drawTool) {
        if (!DrawTool.isNameValid(drawTool.name))
        {
            throw Error("Invalid DrawTool.");
        }
        if (this._drawInteraction)
        {
            openLayersHandler.map.removeInteraction(this._drawInteraction);
        }
        this.SelectedDrawTool = drawTool;

        
        this._drawInteraction = new ol.interaction.Draw({
            source: globalVectorSource,
            type: 'Circle',
            geometryFunction: this.SelectedDrawTool.geometryFunction
        });
        openLayersHandler.map.addInteraction(this._drawInteraction);
        
    }


    set SelectedMapMiner(mapMinerId) {
        this._SelectedMapMiner = mapMinerId;

        
        let mapMiner = this._mapMinersAndFeatures[mapMinerId];

        this.jqbtnExecuteQuery.removeClass("hidden");
        this.jqbtnClearSelections.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnMapMiner, mapMiner.name, false);
        

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

        this.setLabelSelectionBtn(this.jqbtnMapFeature, mapFeatureName, false);

        if (!this.SelectedMapMiner)
        {
            this.filterMinersByFeatureName(mapFeatureName);
        }
    }

    set SelectedImageProvider(imageProviderId) {
        this._SelectedImageProvider = imageProviderId;

        this.jqbtnCollectImages.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnImageProvider, this._imageProviders[imageProviderId].name, false);
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
        this.setLabelSelectionBtn(this.jqbtnMapMiner, "Map Miner", true);
        this.setLabelSelectionBtn(this.jqbtnMapFeature, "Feature", true);

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
            for (let layerIdx in region.layers)
            {
                const layer = region.layers[layerIdx];
                const layerId = layer.layerId;
                const mapMinerName = this._mapMinersAndFeatures[layerId.MapMinerId].name;
                const featureName = layerId.FeatureName;
                let hintLayer = `${mapMinerName} - ${featureName}`;
                if (hintLayers.indexOf(hintLayer) < 0)
                {
                    hintLayers.push(hintLayer);
                }
            }
        }

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
    
    populateShapeDiv()
    {
        this.jqshapeSelectorDiv.empty();
        for (let shapeIdx in UIHandler.DrawTools)
        {
            const shape = UIHandler.DrawTools[shapeIdx];
            const btnShape = this.create_dropDown_aButton(shape.name, shape, this.changeShapeClick);
            this.jqshapeSelectorDiv.append(btnShape);
        }
    }

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
        for (let imageProviderIdx in this._imageProviders) {
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
        for (let mapMinerId in this._mapMinersAndFeatures) {
            const mapMiner = this._mapMinersAndFeatures[mapMinerId];
            const btnMapMiner = this.create_dropDown_aButton(mapMiner.name, mapMinerId, this.changeMapMiner);
            this.jqmapMinerDiv.append(btnMapMiner);
            for (let featureIdx in mapMiner.features) {
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
        for (let mapMinerIdx in this._mapMinersAndFeatures) {
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
        for (let featureIdx in mapMiner.features) {
            let featureName = mapMiner.features[featureIdx];
            let mapFeature = this.create_dropDown_aButton(featureName, featureName, this.changeMapFeature);
            this.jqmapFeatureDiv.append(mapFeature);
        }
    }

    //#endregion Map Miner and Features
}

if (!UIHandler.init) {
    UIHandler.init = true;

    /**
     * Collection of registered tile providers from OpenLayers
     * @example 
     * //OpenStreetMaps tile provider
     * OpenLayersHandler.TileProviders.OSM
     * @example 
     * //Google road maps tile provider
     * OpenLayersHandler.TileProviders.GOOGLE_ROADMAP_TILES
     * @example 
     * //Google satelite with road maps tile provider
     * OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES
     * @see [OpenLayers Sources]{@link https://github.com/openlayers/openlayers/tree/v5.0.3/src/ol/source}
     */
    UIHandler.DrawTools =
        {
            Box: new DrawTool('Box', ol.interaction.Draw.createBox()),
            Square: new DrawTool('Square', ol.interaction.Draw.createRegularPolygon(4)),
            Dodecagon: new DrawTool('Dodecagon', function (coordinates, geometry) {
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
            }),
        };
}


