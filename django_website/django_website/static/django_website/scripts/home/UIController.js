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
        this.uiView.onClickExecuteImageFilterBtn = this.onClickExecuteImageFilterBtn.bind(this);

        this.uiView.onClickSaveSessionBtn = this.onClickSaveSessionBtn.bind(this);
        this.uiView.onClickNewSessionBtn = this.onClickNewSessionBtn.bind(this);


        this.uiView.onClickChangeShapeBtn = this.onClickChangeShapeBtn.bind(this);
        this.uiView.onClickChangeMapProviderBtn = this.onClickChangeMapProviderBtn.bind(this);
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

        GeoImageManager.on('geoimagescollectionchange', this.onGeoImagesCollectionChange.bind(this));
        GeoImageManager.on('imagechange', this.onImageChange.bind(this));

    }

    /**
     * Updates the currently image displayed by the GeoImageManager
     * when the user changes the imgSlider value (position).
     * @param {int} value - The current position of the imgSlider as informed by itself
     */
    onImageSliderInput(event) {
        let slider = event.target;
        geoImageManager.displayFeatureAtIndex(slider.value, true);
        geoImageManager.autoPlayGeoImages(GeoImageManager.PlayCommands.Pause);
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
        this.uiModel.changeMapProvider(tileProvider.provider);
    }

    onClickChangeImageProvider(event) {
        let imageProvider = event.data;

        this.uiView.updateImageProviderView(imageProvider);
        this.uiModel.SelectedImageProvider = imageProvider;
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

    onGeoImagesCollectionChange() {
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

    onClickClearSelectionsBtn() {
        this.uiView.clearSelections();
    }

    onClickSaveSessionBtn() {
        let currentSessionName = this.uiModel.currentSessionName;
        let sessionName = this.uiView.askSessionName(currentSessionName);
        this.uiModel.saveSession(sessionName);
    }

    onClickNewSessionBtn() {
        this.uiModel.newSession();
    }

    onClickExecuteQueryBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteQuery);
        let unset = (() => this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteQuery));
        this.uiModel.executeQuery.bind(this.uiModel)(this.uiView.SelectedMapMiner, this.uiView.SelectedMapFeature).then(unset, error => { alert(error); unset(); });
    }

    async onClickExecuteImageFilterBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteImageFilter);
        let unset = (() => this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteImageFilter));
        let filterId = this.uiModel.SelectedImageFilter;
        await this.uiModel.getProcessedImages.bind(this.uiModel)()
        //.then(function (filterId) {
        unset();
        //Set the geoImageManager to display this collection
        this.geoImageManager.updateDisplayingLayers(filterId);

        //    }.bind(this), error => { unset(); alert(error); });
    }

    onClickGetImagesBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnCollectImages);
        let unset = (() => this.uiView.unsetLoadingText(this.uiView.jqbtnCollectImages));
        this.uiModel.getImages(this.uiModel.SelectedImageProvider.idprovider).then(
            () => {
                unset();
                //Set the geoImageManager to display this collection
                this.geoImageManager.updateDisplayingLayers();
            }, error => { unset(); alert(error); });
    }
}