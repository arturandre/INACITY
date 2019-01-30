class UIController {
    constructor(uiModel, uiView, geoImageManager) {
        this.uiModel = uiModel;
        this.uiView = uiView;
        this.geoImageManager = geoImageManager;
    }

    initialize() {

        this.uiView.onClickExecuteQueryBtn = this.onClickExecuteQueryBtn.bind(this);
        this.uiView.onClickGetImagesBtn = this.onClickGetImagesBtn.bind(this);
        this.uiView.onClickClearSelectionsBtn = this.onClickClearSelectionsBtn.bind(this);
        this.uiView.onClickExecuteImageFilterBtn = this.onClickExecuteImageFilterBtn.bind(this);
        
        this.uiView.onClickSaveSessionBtn = this.onClickSaveSessionBtn.bind(this);

        /*UIModel Event Handlers*/
        /*onregionlistitemclick - Triggers when an region is [de]/selected ([de]/activated)*/
        UIModel.on('regionlistitemclick', this.onClickRegionListItem.bind(this));
        UIModel.on('featuresmerged', this.onFeaturesMerged.bind(this));

        Layer.on('featurecollectionchange', this.onFeatureCollectionChange.bind(this));

        GeoImageManager.on('geoimagescollectionchange', this.onGeoImagesCollectionChange.bind(this));
        GeoImageManager.on('imagechange', this.onImageChange.bind(this));

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
        let currentSessionName = this.uiModel.getCurrentSessionName();
        let sessionName = this.uiView.askSessionName(currentSessionName);
        
    }

    

    onClickExecuteQueryBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteQuery);
        let unset = (() => this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteQuery));
        this.uiModel.executeQuery.bind(this.uiModel)(this.uiView.SelectedMapMiner, this.uiView.SelectedMapFeature).then(unset, error => { alert(error); unset(); });
    }

    onClickExecuteImageFilterBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteImageFilter);
        let unset = (() => this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteImageFilter));
        this.uiModel.getProcessedImages.bind(this.uiModel)(this.uiView.SelectedImageFilter.id).then
        (function (filterId) {
                unset();
                //Set the geoImageManager to display this collection
                this.geoImageManager.updateDisplayingLayers(filterId);
                
            }.bind(this, this.uiView.SelectedImageFilter.id), error => { unset(); alert(error); });
    }

    onClickGetImagesBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnCollectImages);
        let unset = (() => this.uiView.unsetLoadingText(this.uiView.jqbtnCollectImages));
        this.uiModel.getImages(this.uiView.SelectedImageProvider.idprovider).then(
            () => {
                unset();
                //Set the geoImageManager to display this collection
                this.geoImageManager.updateDisplayingLayers();
            }, error => { unset(); alert(error); });
    }
}