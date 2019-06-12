class UIController {
    constructor(uiModel, uiView, geoImageManager, openLayersHandler) {
        this.uiModel = uiModel;
        this.uiView = uiView;
        this.geoImageManager = geoImageManager;
        this.openLayersHandler = openLayersHandler;
    }

    initialize() {

        this.uiView.onClickExecuteQueryBtn = this.onClickExecuteQueryBtn.bind(this);
        this.uiView.onClickGetImagesBtn = this.onClickGetImagesBtn.bind(this);
        this.uiView.onClickClearSelectionsBtn = this.onClickClearSelectionsBtn.bind(this);
        this.uiView.onClickAddressBarBtn = this.onClickAddressBarBtn.bind(this);
        this.uiView.onClickExecuteImageFilterBtn = this.onClickExecuteImageFilterBtn.bind(this);

        this.uiView.onClickSaveSessionBtn = this.onClickSaveSessionBtn.bind(this);
        this.uiView.onClickNewSessionBtn = this.onClickNewSessionBtn.bind(this);


        this.uiView.onClickChangeShapeBtn = this.onClickChangeShapeBtn.bind(this);
        this.uiView.onClickChangeMapProviderBtn = this.onClickChangeMapProviderBtn.bind(this);
        this.uiView.onClickChangeMapMinerBtn = this.onClickChangeMapMinerBtn.bind(this);;
        this.uiView.onClickChangeMapFeatureBtn = this.onClickChangeMapFeatureBtn.bind(this);;

        this.uiView.onClickCancelDrawingBtn = this.onClickCancelDrawingBtn.bind(this);
        this.uiView.onClickChangeImageFilter = this.onClickChangeImageFilter.bind(this);
        this.uiView.onClickChangeViewMode = this.onClickChangeViewMode.bind(this);
        this.uiView.onImageSliderInput = this.onImageSliderInput.bind(this);

        this.openLayersHandler.onDrawEnd = this.onDrawEnd.bind(this);





        /*UIModel Event Handlers*/
        /*onregionlistitemclick - Triggers when an region is [de]/selected ([de]/activated)*/
        UIModel.on('regionlistitemclick', this.onClickRegionListItem.bind(this));
        UIModel.on('featuresmerged', this.onFeaturesMerged.bind(this));

        Layer.on('featurecollectionchange', this.onFeatureCollectionChange.bind(this));

        GeoImageManager.on('geoimagecollectionchange', this.onGeoImageCollectionChange.bind(this));
        GeoImageManager.on('imagechange', this.onImageChange.bind(this));

    }

    /**
     * Updates the currently image displayed by the GeoImageManager
     * when the user changes the imgSlider value (position).
     * @param {int} value - The current position of the imgSlider as informed by itself
     */
    onImageSliderInput(event) {
        let slider = event.target;
        //geoImageManager.displayGeoImageAtIndex(parseInt(slider.value), true);
        this.uiModel.imgSliderMoving = true;
        geoImageManager.displayGeoImageAtIndex(parseInt(slider.value));
        geoImageManager.autoPlayGeoImages(GeoImageManager.PlayCommands.Pause);
        this.uiModel.imgSliderMoving = false;
    }

    onDrawEnd(eventKey) {
        this.uiModel.createRegion(eventKey.feature, true);

        //Cancel drawing
        this.uiView.updateShapeToolView(null);
        this.openLayersHandler.SelectedDrawTool = null;
    }

    onClickChangeShapeBtn(event) {
        let drawTool = event.data;

        this.uiView.updateShapeToolView(drawTool);
        this.openLayersHandler.SelectedDrawTool = drawTool;
    }

    onClickChangeViewMode(event) {
        let viewmode = event.data;

        this.uiView.changeViewMode(viewmode);
        this.uiModel.SelectedViewMode = viewmode;
    }

    /**
    * Handler for changing map tiles.
    * @param {string} mapProviderId - Id defined by OpenLayers to set a tile provider
    * @param {Event} - See [Event]{@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
    */
    onClickChangeMapProviderBtn(event) {
        let tileProvider = event.data;

        this.uiView.updateMapProviderView(tileProvider);
        this.openLayersHandler.SelectedMapProvider = tileProvider;
    }

    onClickChangeImageProvider(event) {
        let imageProvider = event.data;

        this.uiView.updateImageProviderView(imageProvider);
        this.uiModel.SelectedImageProvider = imageProvider;
    }

    onClickChangeMapMinerBtn(event) {
        let mapMiner = event.data;

        this.uiView.updateMapMinerView(mapMiner);
        this.uiModel.SelectedMapMiner = mapMiner;
    }

    onClickChangeMapFeatureBtn(event) {
        let mapFeature = event.data;

        this.uiView.updateFeatureView(mapFeature);
        this.uiModel.SelectedMapFeature = mapFeature;
    }



    onClickChangeImageFilter(event) {
        let imageFilter = event.data;

        this.uiView.updateImageFilterView(imageFilter);
        this.uiModel.SelectedImageFilter = imageFilter;
    }

    //cancelDrawing() {
    onClickCancelDrawingBtn(event) {
        this.uiView.updateShapeToolView(null);
        this.openLayersHandler.SelectedDrawTool = null;
    }

    onImageChange() {
        this.uiView.updateGeoImgSlider();
    }

    onGeoImageCollectionChange() {
        this.uiView.updateGeoImgSlider();
        this.uiModel.saveSession();
    }

    onFeatureCollectionChange(layer) {
        this.uiView.updateLayersHintList();
        if (layer) {
            this.uiModel.updateFeatureIndex(layer.layerId.toString()); //Model commands should be before View commands
            this.uiView.drawLayer(layer, true);
        }
    }

    onFeaturesMerged(layer) {
        this.uiView.drawLayer(layer, true);
    }

    onClickRegionListItem() {
        this.uiView.updateLayersHintList();
    }

    onClickAddressBarBtn() {
        
    }

    onClickClearSelectionsBtn() {
        this.uiModel.SelectedMapMiner = null;
        this.uiModel.SelectedMapFeature = null;

        this.uiView.clearSelections();
    }

    async onClickSaveSessionBtn() {
        let currentSessionName = this.uiModel.currentSessionName;
        let sessionName = this.uiView.askSessionName(currentSessionName);
        await this.uiModel.saveSession(sessionName);
    }

    async onClickNewSessionBtn() {
        await this.uiModel.newSession();
    }

    async onClickExecuteQueryBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteQuery);
        try
        {
            //await this.uiModel.executeQuery.bind(this.uiModel)();
            await this.uiModel.executeQuery();
        }
        finally
        {
            this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteQuery)
        }
    }

    async onClickExecuteImageFilterBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteImageFilter);

        let filterId = this.uiModel.SelectedImageFilter.id;
        try
        {
            await this.uiModel.getProcessedImages.bind(this.uiModel)()
            //Set the geoImageManager to display this collection
            this.geoImageManager.updateDisplayingLayers(filterId);
        }
        finally
        {
            this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteImageFilter)
        }
    }

    async onClickGetImagesBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnCollectImages);
        try {
            await this.uiModel.getImages(this.uiModel.SelectedImageProvider.id);
            //Set the geoImageManager to display this collection
            this.geoImageManager.updateDisplayingLayers();
        }
        finally {
            this.uiView.unsetLoadingText(this.uiView.jqbtnCollectImages)
        }
    }
}