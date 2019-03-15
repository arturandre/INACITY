/**
* Responsible for keeping the state of the UI
* @module "UIView.js"
*/




/**
 * Responsible for keeping user selections.
 * @param {string} SelectedMapMiner - Selected map miner's id
 * @param {string} SelectedMapFeature - Selected map features's id
 * @param {string} SelectedImageProvider - Selected image providers' id
 * @param {ImageProvider[]} _imageProviders - The collection of Image Providers as reported by the backend
 * @param {MapMiner[]} _mapMinersAndFeatures - The collection of Map Miners and its respective features as reported by the backend
 */
class UIView {
    constructor(uiModel, geoImageManager) {
        this.uiModel = uiModel;
        this.geoImageManager = geoImageManager;

        this.onClickExecuteQueryBtn = null;
        this.onClickExecuteImageFilterBtn = null;
        this.onClickGetImagesBtn = null;
        this.onClickClearSelectionsBtn = null;
        
        this.onClickSaveSessionBtn = null;
        this.onClickNewSessionBtn = null;

        this.onClickChangeShapeBtn = null;
        this.onClickChangeMapProviderBtn = null;
        this.onClickCancelDrawingBtn = null;
        this.onClickChangeImageFilter = null;

        this.onImageSliderInput = null;
        
        
        

        this.jqimageProviderDiv = $(`#imageProviderDiv`);
        this.jqimageFilterDiv = $(`#imageFilterDiv`);
        this.jqmapMinerDiv = $(`#mapMinerDiv`);
        this.jqmapFeatureDiv = $(`#mapFeatureDiv`);
        this.jqshapeSelectorDiv = $(`#shapeSelectorDiv`);
        this.jqmapProviderDiv = $(`#mapProviderDiv`);
        this.jqchangeModeDiv = $(`#changeModeDiv`);

        this.jqbtnSaveSession = $(`#btnSaveSession`);
        this.jqbtnNewSession = $(`#btnNewSession`);
        

        this.jqbtnExecuteImageFilter = $(`#btnExecuteImageFilter`);
        this.jqbtnImageFilter = $(`#btnImageFilter`);
        this.jqbtnImageProvider = $(`#btnImageProvider`);
        this.jqbtnMapMiner = $(`#btnMapMiner`);
        this.jqbtnMapFeature = $(`#btnMapFeature`);

        this.jqbtnMapProvider = $(`#btnMapProvider`);

        this.jqbtnCancelDrawing = $(`#btnCancelDrawing`);

        this.jqbtnShapeSelector = $(`#btnShapeSelector`);
        

        this.jqbtnExecuteQuery = $(`#btnExecuteQuery`);
        this.jqbtnCollectImages = $(`#btnCollectImages`);
        this.jqbtnClearSelections = $(`#btnClearSelections`);

        this.jqimgSliderDiv = $('#imgSliderDiv');
        this.jqimgSlider = $('#imgSlider')

        this.jqimageDiv = $(".image-div");
        this.jqregionDiv = $(".region-div");
        


        
        
        this._fillMapMinersAndFeaturesDiv();
    }

    initialize() {
        this.jqbtnExecuteQuery.on("click", this.onClickExecuteQueryBtn.bind(this));
        this.jqbtnExecuteImageFilter.on("click", this.onClickExecuteImageFilterBtn.bind(this));
        this.jqbtnCollectImages.on("click", this.onClickGetImagesBtn.bind(this));
        this.jqbtnClearSelections.on("click", this.onClickClearSelectionsBtn.bind(this));

        this.jqbtnSaveSession.on("click", this.onClickSaveSessionBtn.bind(this));
        this.jqbtnNewSession.on("click", this.onClickNewSessionBtn.bind(this));
        
        this.jqbtnCancelDrawing.on("click", this.onClickCancelDrawingBtn);

        this.jqimgSlider.on("input", this.onImageSliderInput);

        //this.populateShapeDiv();
        this.createSelectionButton(this.jqshapeSelectorDiv, OpenLayersHandler.DrawTools, this.onClickChangeShapeBtn);
        //this.populateMapProviderDiv();
        this.createSelectionButton(this.jqmapProviderDiv, OpenLayersHandler.TileProviders, this.onClickChangeMapProviderBtn);
        //this._fillImageProviderDiv();
        this.createSelectionButton(this.jqimageProviderDiv, this.uiModel.imageProviders, this.changeImageProviderClick);
        //this.populateChangeModeDiv();
        this.createToggleRadioSelection('viewmodeloptions', this.jqchangeModeDiv, UIView.ViewModes, this.onClickChangeViewMode);
        //this._fillImageFilterDiv();
        //this.createSelectionButton(this.jqimageFilterDiv, this.uiModel.imageFilters, this.changeImageFilterClick);
        this.createSelectionButton(this.jqimageFilterDiv, this.uiModel.imageFilters, this.onClickChangeImageFilter);
    }

    setDefaults(defaults) {
        if (defaults.shape) {
            this.updateShapeToolView(defaults.shape);
            //this.uiModel.changeShapeTool(defaults.shape);
            //this.changeShapeClick(defaults.shape);
        }
        if (defaults.tileProvider) {
            //this.uiModel.changeMapProvider(defaults.tileProvider);
            this.updateMapProviderView(defaults.tileProvider);
        }
        if (defaults.viewmode) {
            this.changeViewMode(defaults.viewmode);
            //this.uiModel.SelectedViewMode = defaults.viewmode;
        }
        if (defaults.imageProvider) {
            //this.uiModel.SelectedImageProvider = this.uiModel.imageProviders[defaults.imageProvider];
            this.updateImageProviderView(this.uiModel.imageProviders[defaults.imageProvider]);
        }
        if (defaults.imageFilter)
        {
            this.updateImageFilterView(defaults.imageFilter);
            //this.uiModel.SelectedImageFilter = defaults.imageFilter;
        }
        if (defaults.mapMiner) {
            this.changeMapMiner(defaults.mapMiner);
            if (defaults.mapFeature) {
                this.changeMapFeature(defaults.mapFeature);
            }
        }

    }

    askSessionName(currentSessionName="")
    {
        return window.prompt(gettext("Would you like to give this session a name? Current one is:"), currentSessionName);
    }

    

    changeViewMode(viewmode)
    {
        switch (viewmode.viewmode) {
            case 'Map':
                this.jqimageDiv.addClass('hidden');
                this.jqregionDiv.removeClass('hidden');
                break;
            case 'Image':
                this.jqregionDiv.addClass('hidden');
                this.jqimageDiv.removeClass('hidden');
                break;
            default:
                console.error(gettext("Unknown mode selected!"));
                break;
        }
        let viewModeLabel = $(`#changeModeDiv > label:contains('${viewmode.name}')`);
        let viewModeBtn = $(`#changeModeDiv > label:contains('${viewmode.name}') > input`);
        if (!viewModeBtn.prop('checked')) {
            viewModeLabel.button('toggle');
            viewModeLabel.removeClass('focus');
        }
    }

    setLabelSelectionBtn(jqselectorButton, label, deselected) {
        if (deselected) {
            jqselectorButton.removeClass("btn-success");
            jqselectorButton.addClass("btn-secondary");
        }
        else {
            jqselectorButton.addClass("btn-success");
            jqselectorButton.removeClass("btn-secondary");
        }
        jqselectorButton.html(label);
    }

    updateGeoImgSlider() {
        let numGeoImages = this.geoImageManager.validImages;

        if (numGeoImages > 0) {
            // this.jqimgSlider.attr('min', 0);
            // this.jqimgSlider.attr('value', this.geoImageManager.currentIndex);
            // this.jqimgSlider.attr('max', numGeoImages-1);
            this.jqimgSlider[0].min = 0;
            this.jqimgSlider[0].value = this.geoImageManager.currentIndex;
            this.jqimgSlider[0].max = numGeoImages-1;
            this.jqimgSliderDiv.removeClass("hidden");
        }
        else {
            this.jqimgSliderDiv.addClass("hidden");
        }
    }

    set SelectedMapMiner(mapMinerId) {
        this._SelectedMapMiner = mapMinerId;


        let mapMiner = this.uiModel.mapMinersAndFeatures[mapMinerId];

        this.jqbtnExecuteQuery.removeClass("hidden");
        this.jqbtnClearSelections.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnMapMiner, mapMiner.name, false);


        if (!this.SelectedMapFeature) {
            this.filterFeaturesByMapMiner(mapMiner);
            if (mapMiner.features.length === 1) {
                this.changeMapFeature(mapMiner.features[0]);
            }
        }
    }

    set SelectedMapFeature(mapFeatureName) {
        this._SelectedMapFeature = mapFeatureName;

        this.jqbtnClearSelections.removeClass("hidden");
        this.jqbtnExecuteQuery.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnMapFeature, mapFeatureName, false);

        if (!this.SelectedMapMiner) {
            this.filterMinersByFeatureName(mapFeatureName);
        }
    }

    updateImageProviderView(imageProvider)
    {
        this.jqbtnCollectImages.removeClass("hidden");
        this.jqbtnImageFilter.removeClass("hidden");
        this.setLabelSelectionBtn(this.jqbtnImageProvider, imageProvider.name, false);
    }

    updateMapProviderView(tileProvider)
    {
        this.setLabelSelectionBtn(this.jqbtnMapProvider, tileProvider.name, false);
    }

    updateImageFilterView(imageFilter)
    {
        this.setLabelSelectionBtn(this.jqbtnImageFilter, imageFilter, false);
    }

    updateShapeToolView(drawTool)
    {
        if (drawTool === null)
        {
            this.setLabelSelectionBtn(this.jqbtnShapeSelector, gettext("Shape"), true);
            this.jqbtnCancelDrawing.addClass("hidden");
            return;
        }
        this.setLabelSelectionBtn(this.jqbtnShapeSelector, drawTool.name, false);
        this.jqbtnCancelDrawing.removeClass('hidden');
    }

    

    get SelectedMapMiner() { return this._SelectedMapMiner; }
    get SelectedMapFeature() { return this._SelectedMapFeature; }
    
    

    /**
     * Creates an anchor button (<a href...>)
     * @param {string} label - The button title
     * @param {object} optValue - The parameter to be used for the click handler
     * @param {function} clickHandler - A function that receives "optValue" as parameter and is triggered when the button is clicked
     */
    createDropDownAnchorButton(label, optValue, clickHandler) {
        let button = $(document.createElement('a'));
        button.addClass('dropdown-item');
        button.append(label);
        button.attr("href", "javascript:void(0);");
        button.click(optValue, clickHandler);
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
        this.setLabelSelectionBtn(this.jqbtnMapMiner, gettext("Map Miner"), true);
        this.setLabelSelectionBtn(this.jqbtnMapFeature, gettext("Feature"), true);
    }

    drawLayer(layer, forceRedraw) {
        if (!layer) { console.warn(gettext("Undefined layer!")); return; }
        let featureCollection = layer.featureCollection;
        let olGeoJson = new ol.format.GeoJSON({ featureProjection: featureCollection.crs.properties.name });

        for (let featureIdx in featureCollection.features) {
            let feature = featureCollection.features[featureIdx];

            if (!this.uiModel.isFeatureActive(layer.layerId.toString(), feature.id)) continue;

            if (this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed) {
                if (forceRedraw) {
                    let olFeature = this.uiModel.openLayersHandler.globalVectorSource.getFeatureById(feature.id);
                    this.uiModel.openLayersHandler.globalVectorSource.removeFeature(olFeature);
                    olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
                    this.uiModel.openLayersHandler.globalVectorSource.addFeature(olFeature);
                    this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed = true;
                }
                else {
                    continue;
                }
            }
            else {
                let olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
                this.uiModel.openLayersHandler.globalVectorSource.addFeature(olFeature);
                this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed = true;
            }

        }
    }

    removeLayer(layer) {
        if (!layer) { console.warn(gettext("Undefined layer!")); return; }
        let featureCollection = layer.featureCollection;

        for (let featureIdx in featureCollection.features) {
            let feature = featureCollection.features[featureIdx];
            /*
            Each individual feature needs to be checked because it
            can belong to more than one layer (from differente regions)
            */
            if (!this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed || this.uiModel.isFeatureActive(layer.layerId.toString(), feature.id)) continue;
            else {
                let olFeature = this.uiModel.openLayersHandler.globalVectorSource.getFeatureById(feature.id);
                this.uiModel.openLayersHandler.globalVectorSource.removeFeature(olFeature);
                this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed = false;
            }
        }
    }

    /**
    * Changes the html of buttons to indicate it's busy.
    * @param {JQueryObject} jqElement - An jquery element representing an html component (usually a button in this case)
    */
    setLoadingText(jqElement) {
        let loadingText = '<i class="far fa-compass fa-spin"></i> '+gettext('Loading')+'...';
        jqElement.data('original-text', jqElement.html());
        jqElement.html(loadingText);
    }

    /**
    * Changes the html of buttons back to its unbusy state.
    * @param {JQueryObject} jqElement - An jquery element representing an html component (usually a button in this case)
    */
    unsetLoadingText(jqElement) {
        if (jqElement.data('original-text')) {
            jqElement.html(jqElement.data('original-text'));
        }
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
        let activeRegions = this.uiModel.getActiveRegions();
        for (let regionIdx in activeRegions) {

            let region = activeRegions[regionIdx];
            for (let layerIdx in region.layers) {
                const layer = region.layers[layerIdx];
                const layerId = layer.layerId;
                const mapMinerName = this.uiModel.mapMinersAndFeatures[layerId.MapMinerId].name;
                const featureName = layerId.FeatureName;
                let hintLayer = `${mapMinerName} - ${featureName}`;
                if (hintLayers.indexOf(hintLayer) < 0) {
                    hintLayers.push(hintLayer);
                }
            }
        }

        this.jqbtnCollectImages.attr('data-original-title', gettext("Selected layers are")+":\n" + hintLayers.join('\n'));

        //function refreshHintTitle()
        //{
        //    //Get Images Button
        //    $('#btnCollectImages').attr('data-original-title', "Selected layers are:\n" + hintLayers.join('\n'))
        //}
    }

    createSelectionButton(jqContainerDiv, optionsDict, clickHandler)
    {
        jqContainerDiv.empty();
        for (let optionIdx in optionsDict)
        {
            let option = optionsDict[optionIdx];
            //let btnLabel = (!option.name) ? option.name : optionIdx;
            const optionBtn = this.createDropDownAnchorButton(option.name, option, clickHandler);
            jqContainerDiv.append(optionBtn);
        }
        return jqContainerDiv;
    }

    // populateChangeModeDiv() {
    //     for (let viewModeIdx in UIView.ViewModes) {
    //         let viewMode = UIView.ViewModes[viewModeIdx];
    //         this.jqchangeModeDiv.append(this.createToggleRadioButton('viewmodeloptions', viewMode.name, viewMode, this.changeModeClick));
    //     }
    // }

    createToggleRadioSelection(groupName, jqContainerDiv, optionsDict, clickHandler)
    {
        jqContainerDiv.empty();
        for (let optionIdx in optionsDict)
        {
            let option = optionsDict[optionIdx];
            const optionBtn = this.createToggleRadioButton(groupName, option.name, option, clickHandler);
            jqContainerDiv.append(optionBtn);
        }
        return jqContainerDiv;
    }

    createToggleRadioButton(groupName, label, optValue, clickHandler) {
        let buttonLabel = $(document.createElement('label'));
        let buttonInput = $('<input type="radio">');
        buttonLabel.addClass('btn btn-success');
        buttonInput.attr('name', groupName);
        buttonInput.attr('autocomplete', 'off');
        buttonLabel.html(label);
        buttonInput.change(optValue, clickHandler);
        buttonLabel.append(buttonInput);
        return buttonLabel;
    }




    //#region Image Provider

    // populateShapeDiv() {
    //     this.createSelectionButton(this.jqshapeSelectorDiv, UIView.DrawTools, this.onChangeShapeClick);
    //     // this.jqshapeSelectorDiv.empty();
    //     // for (let shapeIdx in UIView.DrawTools) {
    //     //     const shape = UIView.DrawTools[shapeIdx];
    //     //     const btnShape = this.createDropDownAnchorButton(shape.name, shape, this.onChangeShapeClick);
    //     //     this.jqshapeSelectorDiv.append(btnShape);
    //     // }
    // }

    // populateMapProviderDiv() {
    //     for (let tileProviderId in OpenLayersHandler.TileProviders) {
    //         const tileProvider = OpenLayersHandler.TileProviders[tileProviderId];
    //         this.jqmapProviderDiv.append(this.createDropDownAnchorButton(tileProvider.name, tileProvider, this.onClickChangeMapProviderBtn));
    //     };
    // }

    /**
     * Called when [_imageProviders]{@link module:UIView~_imageProviders} is loaded and
     * the Image Provider Div should be (re)loaded too.
     * @private
     */
    // _fillImageProviderDiv() {
    //     this.createSelectionButton(this.jqimageProviderDiv, this.uiModel.imageProviders, this.changeImageProviderClick);
    //     // this.jqimageProviderDiv.empty();
    //     // for (let imageProviderIdx in this.uiModel.imageProviders) {
    //     //     let imageProviderName = this.uiModel.imageProviders[imageProviderIdx].name;
    //     //     let btnImageProvider = this.createDropDownAnchorButton(imageProviderName, this.uiModel.imageProviders[imageProviderIdx], this.changeImageProviderClick);
    //     //     this.jqimageProviderDiv.append(btnImageProvider);
    //     // }
    // }

    /**
     * Called when [_imageFilters]{@link module:UIView~_imageFilters} is loaded and
     * the Image Filter Div should be (re)loaded too.
     * @private
     */
    
    // _fillImageFilterDiv() {
    //     this.jqimageFilterDiv.empty();
    //     for (let imageFilterIdx in this.uiModel.imageFilters) {
    //         let imageFilterName = this.uiModel.imageFilters[imageFilterIdx].name;
    //         let btnImageFilter = this.createDropDownAnchorButton(imageFilterName, this.uiModel.imageFilters[imageFilterIdx], this.changeImageFilterClick);
    //         this.jqimageFilterDiv.append(btnImageFilter);
    //     }
    // }

    /**
     * Handler for changing image provider.
     * @param {string} imageProviderId - Id defined by backend's class ImageProvider's subclasses
     * @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     */
    // changeImageProviderClick(imageProvider) {
    //     this.SelectedImageProvider = imageProvider;
    // }

    /**
     * Handler for changing image filter.
     * @param {string} imageFilterId - Id defined by backend's class ImageFilter's subclasses
     * @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
     */
    


    //#endregion Image Provider

    //#region Map Miner and Features


    /**
     * Called when [_mapMinersAndFeatures]{@link module:UIView~_mapMinersAndFeatures} is loaded and
     * the Map Miner and Features Divs should be (re)loaded too.
     * @private
     */
    _fillMapMinersAndFeaturesDiv() {
        let currentMapFeatures = [];
        this.jqmapMinerDiv.empty();
        this.jqmapFeatureDiv.empty();
        for (let mapMinerId in this.uiModel.mapMinersAndFeatures) {
            const mapMiner = this.uiModel.mapMinersAndFeatures[mapMinerId];
            const btnMapMiner = this.createDropDownAnchorButton(mapMiner.name, mapMinerId, this.changeMapMiner);
            this.jqmapMinerDiv.append(btnMapMiner);
            for (let featureIdx in mapMiner.features) {
                let featureName = mapMiner.features[featureIdx];
                if (currentMapFeatures.indexOf(featureName) !== -1) continue;
                let mapFeature = this.createDropDownAnchorButton(featureName, featureName, this.changeMapFeature);
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
                let btnMapMiner = this.createDropDownAnchorButton(mapMiner.name, mapMinerIdx, this.changeMapMiner);
                this.jqmapMinerDiv.append(btnMapMiner);
                currentMapMiners.push(mapMinerIdx);
            }
        }
        if (currentMapMiners.length === 1) {
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
            let mapFeature = this.createDropDownAnchorButton(featureName, featureName, this.changeMapFeature);
            this.jqmapFeatureDiv.append(mapFeature);
        }
    }

    //#endregion Map Miner and Features
}

if (!UIView.init) {
    UIView.init = true;

    UIView.ViewModes =
    {
        ImageMode: { name: gettext("Image Mode"), viewmode: "Image" },
        MapMode: { name: gettext("Map Mode"), viewmode: "Map" },
    };
}


