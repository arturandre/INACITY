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
class UIView
{
    constructor(uiModel, geoImageManager, openLayersHandler, streetSelect)
    {
        this.uiModel = uiModel;
        this.geoImageManager = geoImageManager;
        this.openLayersHandler = openLayersHandler;
        this.streetSelect = streetSelect;

        this.onClickExecuteQueryBtn = null;
        this.onClickExecuteImageFilterBtn = null;
        this.onClickGetImagesBtn = null;
        this.onClickClearSelectionsBtn = null;

        this.onClickSaveSessionBtn = null;
        this.onClickNewSessionBtn = null;

        this.onClickChangeShapeBtn = null;
        this.onClickChangeMapProviderBtn = null;
        this.onClickChangeMapMinerBtn = null;
        this.onClickChangeMapFeatureBtn = null;

        this.onClickCancelDrawingBtn = null;
        this.onClickAddressBarBtn = null;
        this.onClickChangeImageFilter = null;


        this.onImageSliderInput = null;


        this.jqlabelSelectedFeature = $(`#lblSelectedFeature`);

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
        this.jqbtnAddressBar = $(`#btnAddressBar`);

        this.jqbtnShapeSelector = $(`#btnShapeSelector`);


        this.jqbtnExecuteQuery = $(`#btnExecuteQuery`);
        this.jqbtnCollectImages = $(`#btnCollectImages`);
        this.jqbtnClearSelections = $(`#btnClearSelections`);

        this.jqimgSliderDiv = $('#imgSliderDiv');
        this.jqimgSlider = $('#imgSlider')

        this.jqimageDiv = $(".image-div");
        this.jqregionDiv = $(".region-div");





        //this._fillMapMinersAndFeaturesDiv();
    }

    initialize()
    {
        this.jqbtnExecuteQuery.on("click", this.onClickExecuteQueryBtn.bind(this));
        this.jqbtnExecuteImageFilter.on("click", this.onClickExecuteImageFilterBtn.bind(this));
        this.jqbtnCollectImages.on("click", this.onClickGetImagesBtn.bind(this));
        this.jqbtnClearSelections.on("click", this.onClickClearSelectionsBtn.bind(this));

        this.jqbtnSaveSession.on("click", this.onClickSaveSessionBtn.bind(this));
        this.jqbtnNewSession.on("click", this.onClickNewSessionBtn.bind(this));

        this.jqbtnCancelDrawing.on("click", this.onClickCancelDrawingBtn);

        this.jqbtnAddressBar.on("click", this.onClickAddressBarBtn);
        this.jqtxtAddressBar = $("#txtAddressBar");

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

        this.createSelectionButton(this.jqmapMinerDiv, this.uiModel.mapMinersAndFeatures, this.onClickChangeMapMinerBtn);
        this.createSelectionButton(
            this.jqmapFeatureDiv,
            $.map(this.uiModel.mapMinersAndFeatures, function (v, k) { return v.features; }),
            this.onClickChangeMapFeatureBtn
        );

        Region.on('activechange', this._updateActiveRegion.bind(this));
        UIModel.on('regioncreated', this._updateActiveRegion.bind(this));

        UIModel.on('regioncreated', this.updateImageProviderView.bind(this));
        Region.on('activechange', this.updateImageProviderView.bind(this));
        SessionManager.on('sessionloaded', this.updateImageProviderView.bind(this));

        SessionManager.on('sessionloaded', this._updateNewSessionButtons.bind(this));
        SessionManager.on('sessionsaved', this._updateNewSessionButtons.bind(this));
        SessionManager.on('sessionsaved', this._updateSaveSessionButtons.bind(this));

        StreetSelect.on("selectedfeaturechanged", this._updateSelectedFeature.bind(this));
        StreetSelect.on("selectedfeaturechanged", this.updateLayersHintList.bind(this));
    }

    /**
     * 
     * @param {OpenLayerFeature} selectedOLFeature - A feature object compatible with the OpenLayers API
     */
    _updateSelectedFeature(selectedOLFeature)
    {
        if (selectedOLFeature)
        {
            this.jqlabelSelectedFeature.show()
            this.jqlabelSelectedFeature.text(gettext("Selected feature: ") + selectedOLFeature.getProperties().name);
        }
        else
        {
            this.jqlabelSelectedFeature.hide();
        }
    }

    _updateSaveSessionButtons(sessionchanged)
    {
        if (sessionchanged)
        {
            let currentDate = new Date();
            this.jqbtnSaveSession.attr('data-original-title', gettext("Last save was ") + currentDate.getHours() + ":" + currentDate.getMinutes());
        }
    }

    _updateNewSessionButtons(sessionchanged)
    {
        if (sessionchanged)
        {
            this.jqbtnNewSession.removeClass('disabled');
        }
        else
        {
            this.jqbtnNewSession.addClass('disabled');
        }
    }

    _updateActiveRegion(region)
    {
        if (region.active)
        {
            for (let layerIdx in region.layers)
            {
                let layer = region.layers[layerIdx];
                this.drawLayer(layer);
            }
        }
        else
        {
            for (let layerIdx in region.layers)
            {
                let layer = region.layers[layerIdx];
                this.removeLayer(layer);
            }
        }
    }

    setDefaults(defaults)
    {
        if (defaults.shape)
        {
            this.updateShapeToolView(defaults.shape);
            //this.uiModel.changeShapeTool(defaults.shape);
            //this.changeShapeClick(defaults.shape);
        }
        if (defaults.tileProvider)
        {
            //this.uiModel.changeMapProvider(defaults.tileProvider);
            this.updateMapProviderView(defaults.tileProvider);
        }
        if (defaults.viewmode)
        {
            this.changeViewMode(defaults.viewmode);
            //this.uiModel.SelectedViewMode = defaults.viewmode;
        }
        if (this.uiModel.SelectedImageProvider)
        {
            //this.uiModel.SelectedImageProvider = this.uiModel.imageProviders[defaults.imageProvider];
            this.updateImageProviderView();
        }
        if (this.uiModel.SelectedImageFilter)
        {
            this.updateImageFilterView(this.uiModel.SelectedImageFilter);
            //this.uiModel.SelectedImageFilter = defaults.imageFilter;
        }
        if (this.uiModel.SelectedMapMiner)
        {
            this.updateMapMinerView(this.uiModel.SelectedMapMiner);
            if (this.uiModel.SelectedMapFeature)
            {
                this.updateFeatureView(this.uiModel.SelectedMapFeature);
            }
        }

    }

    askSessionName(currentSessionName = "")
    {
        return window.prompt(gettext("Would you like to give this session a name? Current one is:"), currentSessionName);
    }

    confirmLayerUpdate(regionName, layerName)
    {
        return window.confirm(gettext("Would you like to update the layer") + " '" + layerName + "' from region '" + regionName + "'?");
    }



    changeViewMode(viewmode)
    {
        switch (viewmode.viewmode)
        {
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
        let viewModeLabel = $(`#changeModeDiv > label[id = '${viewmode.id}']`);
        let viewModeBtn = $(`#changeModeDiv > label[id = '${viewmode.id}'] > input`);
        if (!viewModeBtn.prop('checked'))
        {
            viewModeLabel.button('toggle');
            viewModeLabel.removeClass('focus');
        }
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

    updateGeoImgSlider()
    {
        if (this.uiModel.imgSliderMoving)
        {
            return;
        }
        let numGeoImages = this.geoImageManager.validImages;

        if (numGeoImages > 0)
        {
            // this.jqimgSlider.attr('min', 0);
            // this.jqimgSlider.attr('value', this.geoImageManager.currentIndex);
            // this.jqimgSlider.attr('max', numGeoImages-1);
            this.jqimgSlider[0].min = 0;
            this.jqimgSlider[0].value = this.geoImageManager.currentIndex;
            this.jqimgSlider[0].max = numGeoImages - 1;
            this.jqimgSliderDiv.removeClass("hidden");
        }
        else
        {
            this.jqimgSliderDiv.addClass("hidden");
        }
    }

    updateFeatureView(mapFeature)
    {
        this.jqbtnClearSelections.removeClass("hidden");
        this.jqbtnExecuteQuery.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnMapFeature, mapFeature.name, false);

        if (!this.uiModel.SelectedMapMiner)
        {
            this.filterMinersByFeatureName(mapFeature.name);
        }
    }


    updateMapMinerView(mapMiner)
    {
        this.jqbtnExecuteQuery.removeClass("hidden");
        this.jqbtnClearSelections.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnMapMiner, mapMiner.name, false);

        if (!this.uiModel.SelectedMapFeature)
        {
            this.createSelectionButton(this.jqmapFeatureDiv,
                mapMiner.features, this.onClickChangeMapFeatureBtn);

            if (mapMiner.features.length === 1)
            {
                this.updateFeatureView(mapMiner.features[0]);
            }
        }
    }

    updateImageProviderView()
    {
        let imageProvider = this.uiModel.SelectedImageProvider;
        this.jqbtnCollectImages.removeClass("hidden");
        this.jqbtnImageFilter.removeClass("hidden");
        this.jqbtnExecuteImageFilter.removeClass("hidden");

        this.setLabelSelectionBtn(this.jqbtnImageProvider, imageProvider.name, false);
        if (this.uiModel.getActiveRegions().length > 0)
        {
            this.jqbtnCollectImages.removeClass("disabled");
            this.jqbtnImageFilter.removeClass("disabled");
            this.jqbtnExecuteImageFilter.removeClass("disabled");

        }
        else
        {
            this.jqbtnCollectImages.addClass("disabled");
            this.jqbtnImageFilter.addClass("disabled");
            this.jqbtnExecuteImageFilter.addClass("disabled");
        }
    }

    updateMapProviderView(tileProvider)
    {
        this.setLabelSelectionBtn(this.jqbtnMapProvider, tileProvider.name, false);
    }

    updateImageFilterView(imageFilter)
    {
        this.setLabelSelectionBtn(this.jqbtnImageFilter, imageFilter.name, false);
    }

    updateShapeToolView(drawTool)
    {
        if (drawTool === null)
        {
            this.setLabelSelectionBtn(this.jqbtnShapeSelector,
                `<i class="fal fa-shapes"></i> ${gettext("Shape")}`,
                true);
            this.jqbtnCancelDrawing.addClass("hidden");
            return;
        }
        this.setLabelSelectionBtn(this.jqbtnShapeSelector, drawTool.name, false);
        this.jqbtnCancelDrawing.removeClass('hidden');
    }



    // get SelectedMapMiner() { return this._SelectedMapMiner; }
    // get SelectedMapFeature() { return this._SelectedMapFeature; }

    /**
     * Display messages to the user.
     * @param {String} message - The message to be displayed
     * @param {String=Alert} type - The type of the message, can be: Error|Alert
     */
    displayMessage(message, type = 'Alert')
    {
        switch (type)
        {
            case 'Alert':
                alert(message);
                break;
            case 'Error':
                alert(message);
                break;
            default:
                throw Error(`Unknow message type: ${type}`);
                break;
        }
    }


    /**
     * Creates an anchor button (<a href...>)
     * @param {string} label - The button title
     * @param {object} optValue - The parameter to be used for the click handler
     * @param {function} clickHandler - A function that receives "optValue" as parameter and is triggered when the button is clicked
     */
    createDropDownAnchorButton(label, optValue, clickHandler)
    {
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
    clearSelections()
    {

        //Selection fields
        // this._SelectedMapFeature = null;
        // this._SelectedMapMiner = null;

        //Execution buttons
        this.jqbtnClearSelections.addClass("hidden");
        this.jqbtnExecuteQuery.addClass("hidden");

        //Selection buttons
        this.setLabelSelectionBtn(this.jqbtnMapMiner, gettext("Map Miner"), true);
        this.setLabelSelectionBtn(this.jqbtnMapFeature, gettext("Feature"), true);

        this.createSelectionButton(this.jqmapMinerDiv, this.uiModel.mapMinersAndFeatures, this.onClickChangeMapMinerBtn);
        this.createSelectionButton(
            this.jqmapFeatureDiv,
            $.map(this.uiModel.mapMinersAndFeatures, function (v, k) { return v.features; }),
            this.onClickChangeMapFeatureBtn
        );
    }

    drawLayer(layer, forceRedraw)
    {
        if (!layer) { console.warn(gettext("Undefined layer!")); return; }
        let featureCollectionOL = layer.featureCollectionOL;
        let featureCollection = layer.featureCollection;

        if (!featureCollection) { console.warn(gettext("Empty layer (no feature collection)!")); return; }

        //let olGeoJson = new ol.format.GeoJSON({ featureProjection: featureCollection.crs.properties.name });

        for (let featureIdx in featureCollection.features)
        {
            let featureOL = featureCollectionOL.features[featureIdx];
            let feature = featureCollection.features[featureIdx];

            if (!this.uiModel.isFeatureActive(layer.layerId.toString(), feature.id)) continue;

            if (this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed)
            {
                if (forceRedraw)
                {
                    featureOL.changed();
                    //let olFeature = this.uiModel.openLayersHandler.globalVectorSource.getFeatureById(feature.id);
                    //olFeature.changed();
                    //this.uiModel.openLayersHandler.globalVectorSource.removeFeature(olFeature);
                    //olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
                    //this.uiModel.openLayersHandler.globalVectorSource.addFeature(olFeature);
                    this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed = true;
                }
                else
                {
                    continue;
                }
            }
            else
            {
                //let olFeature = olGeoJson.readFeature(feature, { featureProjection: featureCollection.crs.properties.name });
                //this.uiModel.openLayersHandler.globalVectorSource.addFeature(olFeature);
                this.openLayersHandler.globalVectorSource.addFeature(featureOL);
                this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed = true;
            }
        }
    }

    removeLayer(layer)
    {
        if (!layer) { console.warn(gettext("Undefined layer!")); return; }
        let featureCollection = layer.featureCollection;

        if (!featureCollection) { console.warn(gettext("Empty layer (no feature collection)!")); return; }

        for (let featureIdx in featureCollection.features)
        {
            let feature = featureCollection.features[featureIdx];
            /*
            Each individual feature needs to be checked because it
            can belong to more than one layer (from differente regions)
            */
            if (!this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed || this.uiModel.isFeatureActive(layer.layerId.toString(), feature.id)) continue;
            else
            {
                if (layer.hasOlFeatures)
                {
                    this.openLayersHandler.globalVectorSource.removeFeature(feature);
                    this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.getProperties().name].drawed = false;
                }
                else
                {
                    let olFeature = this.openLayersHandler.globalVectorSource.getFeatureById(feature.id);
                    this.openLayersHandler.globalVectorSource.removeFeature(olFeature);
                    this.uiModel.featuresByLayerId[layer.layerId.toString()][feature.id].drawed = false;
                }
            }
        }
    }

    /**
    * Changes the html of buttons to indicate it's busy.
    * @param {JQueryObject} jqElement - An jquery element representing an html component (usually a button in this case)
    */
    setLoadingText(jqElement)
    {
        let loadingText = '<i class="far fa-compass fa-spin"></i> ' + gettext('Loading') + '...';
        jqElement.data('original-text', jqElement.html());
        jqElement.html(loadingText);
    }

    /**
    * Changes the html of buttons back to its unbusy state.
    * @param {JQueryObject} jqElement - An jquery element representing an html component (usually a button in this case)
    */
    unsetLoadingText(jqElement)
    {
        if (jqElement.data('original-text'))
        {
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


    updateLayersHintList()
    {
        let hintLayers = [];


        if (this.streetSelect.lastSelectedFeature)
        {
            this.jqbtnCollectImages.attr('data-original-title',
                gettext("The selected feature is") + ":\n" +
                this.streetSelect.lastSelectedFeature.getProperties().name);
            return;
        }

        //Set active layers list tooltip
        let activeRegions = this.uiModel.getActiveRegions();
        for (let regionIdx in activeRegions)
        {

            let region = activeRegions[regionIdx];
            for (let layerIdx in region.layers)
            {
                const layer = region.layers[layerIdx];
                const layerId = layer.layerId;
                const mapMinerName = layerId.MapMiner.name;
                const featureName = layerId.Feature.name;
                let hintLayer = `${mapMinerName} - ${featureName}`;
                if (hintLayers.indexOf(hintLayer) < 0)
                {
                    hintLayers.push(hintLayer);
                }
            }
        }

        this.jqbtnCollectImages.attr('data-original-title', gettext("Selected layers are") + ":\n" + hintLayers.join('\n'));

        //function refreshHintTitle()
        //{
        //    //Get Images Button
        //    $('#btnCollectImages').attr('data-original-title', "Selected layers are:\n" + hintLayers.join('\n'))
        //}
    }

    createSelectionButton(jqContainerDiv, optionsArray, clickHandler)
    {
        jqContainerDiv.empty();
        for (let optionIdx in optionsArray)
        {
            let option = optionsArray[optionIdx];
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
            const optionBtn = this.createToggleRadioButton(groupName, option.id, option.name, option.hint, option, clickHandler);
            jqContainerDiv.append(optionBtn);
        }
        return jqContainerDiv;
    }

    createToggleRadioButton(groupName, id, label, hint, optValue, clickHandler)
    {
        let buttonInput = $('<input type="radio">');
        buttonInput.attr('name', groupName);
        buttonInput.attr('autocomplete', 'off');
        buttonInput.change(optValue, clickHandler);

        let buttonLabel = $(document.createElement('label'));
        buttonLabel.addClass('btn btn-success');
        buttonLabel.html(label);
        buttonLabel.attr('id', id);

        if (hint)
            buttonLabel.attr('data-container', 'body');
        buttonLabel.attr('data-toggle', 'tooltip');
        buttonLabel.attr('data-trigger', 'hover');
        buttonLabel.attr('data-placement', 'right');
        buttonLabel.attr('data-title', hint);



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
    _fillMapMinersAndFeaturesDiv()
    {
        let currentMapFeatures = [];
        this.jqmapMinerDiv.empty();
        this.jqmapFeatureDiv.empty();
        for (let mapMinerId in this.uiModel.mapMinersAndFeatures)
        {
            const mapMiner = this.uiModel.mapMinersAndFeatures[mapMinerId];
            const btnMapMiner = this.createDropDownAnchorButton(mapMiner.name, mapMinerId, this.changeMapMiner);
            this.jqmapMinerDiv.append(btnMapMiner);
            for (let featureIdx in mapMiner.features)
            {
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
    // changeMapMiner(mapMinerId) {
    //     this.SelectedMapMiner = mapMinerId;
    // }



    /**
     * Given a feature name it removes all the map miners from mapMinerDiv that don't contains this feature's name
     * @param {string} FeatureName - The name of the feature as reported by the backend
     */
    filterMinersByFeatureName(FeatureName)
    {
        this.jqmapMinerDiv.empty();
        let currentMapMiners = this.uiModel.mapMinersAndFeatures.filter(
            p => $.map(p.features, (v, k) => v.name).indexOf(FeatureName) !== -1
        );

        // for (let mapMinerIdx in this.uiModel.mapMinersAndFeatures) {
        //     let mapMiner = this.uiModel.mapMinersAndFeatures[mapMinerIdx];
        //     if ($.map(mapMiner.features, function(v,k){return v.name;}).indexOf(FeatureName) != -1) {
        //         let btnMapMiner = this.createDropDownAnchorButton(mapMiner.name, mapMiner, this.updateMapMinerView);
        //         this.jqmapMinerDiv.append(btnMapMiner);
        //         currentMapMiners.push(mapMiner);
        //     }
        // }
        if (currentMapMiners.length === 1)
        {
            this.uiModel.SelectedMapMiner = currentMapMiners[0];
            this.updateMapMinerView(currentMapMiners[0]);
        }
        else
        {
            this.createSelectionButton(this.jqmapMinerDiv, currentMapMiners, this.onClickChangeMapMinerBtn);
        }
    }

    /**
     * Given a MapMiner object it clears the mapFeatureDiv and fills it again only with the features
     * contained in the given MapMiner
     * @param {MapMiner} mapMiner - The MapMiner object
     * @param {string} mapMiner.name - The MapMiner name used for displaying
     * @param {string[]} mapMiner.features - The features' names contained by this MapMiner
     */
    filterFeaturesByMapMiner(mapMiner)
    {
        this.jqmapFeatureDiv.empty();
        for (let featureIdx in mapMiner.features)
        {
            let featureName = mapMiner.features[featureIdx];
            let mapFeature = this.createDropDownAnchorButton(featureName, featureName, this.changeMapFeature);
            this.jqmapFeatureDiv.append(mapFeature);
        }
    }

    //#endregion Map Miner and Features
}

if (!UIView.init)
{
    UIView.init = true;

    UIView.ViewModes =
        {
            ImageMode: {
                id: "Image Mode",
                name: `<i class="fas fa-map-marked-alt"></i> ${gettext("Image Mode")}`,
                viewmode: "Image",
                hint: "Collect images for the selected regions"
                // name: gettext("Image Mode"),
                // viewmode: "Image"
            },
            MapMode: {
                id: "Map Mode",
                name: `<i class="fas fa-map-marked-alt"></i> ${gettext("Map Mode")}`,
                viewmode: "Map",
                hint: gettext("Edit or remove selected regions.")
                // name: gettext("Map Mode"),
                // viewmode: "Map"
            },
        };
}


