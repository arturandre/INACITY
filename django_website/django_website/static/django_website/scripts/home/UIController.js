class UIController {
    /**
     * Following the MVC architectural pattern this class represents
     * the controller and works together the UIModel and the UIView
     * in the scope of the "home" section.
     * @param {UIModel} uiModel 
     * @param {UIView} uiView 
     * @param {GeoImageManager} geoImageManager 
     * @param {OpenLayerHandler} openLayersHandler 
     * @param {SessionManager} sessionManager 
     */
    constructor(uiModel, uiView, geoImageManager, openLayersHandler, sessionManager, streetSelected) {
        this.uiModel = uiModel;
        this.uiView = uiView;
        this.geoImageManager = geoImageManager;
        this.openLayersHandler = openLayersHandler;
        this.sessionManager = sessionManager;
        this._streetSelected = streetSelected;
    }

    initialize() {
        this.uiView.onCloseShapefileModal = this.onCloseShapefileModal.bind(this);
        this.uiView.onChangeInputShapefiles = this.onChangeInputShapefiles.bind(this);
        this.uiView.onClickLoadShapefilesBtn = this.onClickLoadShapefilesBtn.bind(this);

        this.uiView.onErrorImgUrbanPicture = this.onErrorImgUrbanPicture.bind(this);
        this.uiView.onLoadImgUrbanPicture = this.onLoadImgUrbanPicture.bind(this);

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

        this.uiView.onClickSaveCommentBtn = this.onClickSaveCommentBtn.bind(this);
        this.uiView.onClickCancelCommentBtn = this.onClickCancelCommentBtn.bind(this);


        /*UIModel Event Handlers*/
        /*onregionlistitemclick - Triggers when an region is [de]/selected ([de]/activated)*/
        UIModel.on('regionlistitemclick', this.onClickRegionListItem.bind(this));
        UIModel.on('featuresmerged', this.onFeaturesMerged.bind(this));
        UIModel.on('featurecreated', this.onFeatureCreated.bind(this));
        UIModel.on('featureupdated', this.onFeatureUpdated.bind(this));

        UIModel.on('getimages', this.onGetImages.bind(this));

        RegionLayer.on('featurecollectionchange', this.onFeatureCollectionChange.bind(this));

        GeoImageManager.on('geoimagecollectionchange', this.onGeoImageCollectionChange.bind(this));
        GeoImageManager.on('imagechange', this.onImageChange.bind(this));

    }

    onClickSaveCommentBtn()
    {
        if (!user_is_logged)
        {
            alert(gettext("Please log in to make a comment in this image."));
            this.uiView.hideWritingInterface();
            return;
        }
        let commentText = this.uiView.jqcommentTextArea[0].value;
        let geoImageJSON = this.geoImageManager.currentDisplayedGeoImage.toSimpleJSON()
        let promise = this.uiModel.insertCommentForGeoImage(commentText, geoImageJSON);
        promise.then(function (ret)
        {
            let successMessage=gettext("Comment created with success: ")
            this.uiView.displayMessage(successMessage + ret, 'Alert');
        });
        this.uiView.hideWritingInterface();
    }

    onClickCancelCommentBtn()
    {
        this.uiView.hideWritingInterface();
    }

    onClickCreateCommentBtn()
    {
        //user_is_logged is defined at base.html (template file)
        if (!user_is_logged)
        {
            alert(gettext("Please log in to make a comment in this image."));
            return;
        }
        this.uiView.displayWritingInterface();
        //this.jqbtnCreateComment.on("click", this.onClickCreateCommentBtn.bind(this));
        //this.jqbtnViewComments.on("click", this.onClickViewCommentsBtn.bind(this));
    }
    onClickViewCommentsBtn()
    {
        
    }
    
    onClickStreetViewBtn()
    {

    }

    onCloseShapefileModal(event)
    {
        this.uiView.clearSelectedShapefiles();
    }

    onChangeInputShapefiles(event) {
        this.uiView.jqinputShapefiles[0].filesArray = [];
        for (let i = 0; i < uiView.jqinputShapefiles[0].files.length; i++) {
            let file = this.uiView.jqinputShapefiles[0].files[i];
            this.uiView.jqinputShapefiles[0].filesArray[file.name] = file;
        }

        let filesArray = this.uiView.jqinputShapefiles[0].filesArray;

        for (let i in filesArray) {
            let file = filesArray[i];
            let $li = $("<li/>",
                { "class": "list-group-item" })
                .text(file.name);
            let $removeButton = $("<button/>",
                {
                    "class": "close",
                    "aria-label": "Remove"
                }).append(
                    $("<span/>",
                        {
                            "aria-hidden": true
                        }).html("&times;")
                );
            $removeButton.click(function () {
                let filesArray = this.uiView.jqinputShapefiles[0].filesArray;
                filesArray.splice(filesArray.indexOf(file), 1);
                $li.remove();
            }.bind(this));
            $li.append($removeButton);
            this.uiView.jqulSelectedFiles.append($li);
        }
        //<button type="button" class="close" data-dismiss="modal" aria-label="Close">
        //    <span aria-hidden="true">&times;</span>
        //</button>
    }

    async onClickLoadShapefilesBtn(event) {
        let filesArray = this.uiView.jqinputShapefiles[0].filesArray;

        if (filesArray && Object.keys(filesArray).length > 0) {
            let sampleName = Object.keys(filesArray)[0];
            sampleName = sampleName.substr(0,
                sampleName.lastIndexOf('.'));
            function readFilePromise(file) {
                return new Promise(function (resolve, reject) {
                    if (!file) resolve(null);
                    const reader = new FileReader();
                    reader.onerror = function () {
                        this.abort();
                        console.trace(this.error);
                        reject(this.error);
                    };

                    reader.onload = function () {
                        resolve(this.result);
                    };
                    if (file.name.endsWith('.prj')) {
                        reader.readAsText(file);
                    }
                    else {
                        reader.readAsArrayBuffer(file);
                    }
                });
            }

            let shpFile = filesArray[`${sampleName}.shp`];
            let dbfFile = filesArray[`${sampleName}.dbf`];
            let prjFile = filesArray[`${sampleName}.prj`];

            if (!shpFile) {
                let errorMessage = "No .shp file uploaded error!";
                console.trace(errorMessage);
                throw new Error(errorMessage);
            }

            [shpFile, dbfFile, prjFile] = await Promise.all(
                [
                    readFilePromise(shpFile),
                    readFilePromise(dbfFile),
                    readFilePromise(prjFile)
                ]
            );
            let geoJson = null;
            if (dbfFile) {
                geoJson = shp.combine(
                    [
                        shp.parseShp(shpFile, prjFile),
                        shp.parseDbf(dbfFile)
                    ]);
            }
            else {
                geoJson = shp.parseShp(shpFile, prjFile);
            }

            let minLon = geoJson.features[0].geometry.coordinates[0];
            let maxLon = geoJson.features[0].geometry.coordinates[0];

            let minLat = geoJson.features[0].geometry.coordinates[1];
            let maxLat = geoJson.features[0].geometry.coordinates[1];

            let badFeature = null;
            do {
                badFeature = geoJson.features.find((f) =>
                    (f.geometry.coordinates[0] < -180) ||
                    (f.geometry.coordinates[0] > 180) ||
                    (f.geometry.coordinates[1] < -90) ||
                    (f.geometry.coordinates[1] > 90)
                );
                if (badFeature) {
                    geoJson.features.splice(geoJson.features.indexOf(badFeature), 1);
                }
            } while (badFeature);

            //With this it is possible to instantiate a
            //GeoJSON Feature with MultiPoint geometry structured as an OpenLayer one.
            let multipoint = GeoJSONHelper.GeoJSONFeatureWithGeometry(
                new ol.geom.MultiPoint([]));

            geoJson.features.forEach((f) => {
                //if (!f.id) f.id = uuid();
                //f.geometry is already a point.
                multipoint
                    .geometry
                    .coordinates
                    .push(f.geometry.coordinates);
                let lon = f.geometry.coordinates[0];
                let lat = f.geometry.coordinates[1];

                if (lon < minLon) minLon = lon;
                else if (lon > maxLon) maxLon = lon;
                if (lat < minLat) minLat = lat;
                else if (lat > maxLat) maxLat = lat;
            });

            //geoJson.features = new ol.Feature(multipoint);
            geoJson.features = [multipoint];



            //A polygon is a collection of LinearRings
            //Counter-clock wise rings = inner area
            //Clock-wise rings = holes
            //Since the objects are projected using WGS84 here
            //it is safe to assume the projection comes from WGS84
            //and to reproject it to EPSG:3857 (mercator) since it is the
            //default in the OpenStreetMap.
            let boundingBox = [[
                ol.proj.fromLonLat([minLon, minLat]),
                ol.proj.fromLonLat([maxLon, minLat]),
                ol.proj.fromLonLat([maxLon, maxLat]),
                ol.proj.fromLonLat([minLon, maxLat]),
                ol.proj.fromLonLat([minLon, minLat])
            ]];


            let mapFeature = 
            {
                id: "Shapefile",
                name: "Shapefile"
            };
            let mapMiner = 
            {
                id: "Shapefile",
                name: "Shapefile",
                local: true,
                features: [mapFeature]
            };
            this.uiModel.createCustomRegion(boundingBox, geoJson, mapMiner, mapFeature);
            this.uiModel.SelectedMapMiner = mapMiner;
            this.uiModel.SelectedMapFeature = mapFeature;
            this.uiView.updateMapMinerView(mapMiner);
            this.uiView.updateFeatureView(mapFeature);
    
            this.uiView.jqshapefile_modal.modal('hide');



            //let newRegion = this.uiModel.createRegion(boundingBox, true);
            //let newLayer = newRegion.createLayer(new LayerId("custom", "custom"));


            //this.uiModel.add
            //Create a new region with a new Layer and the new geoJson as the FeatureCollection
            //of this Layer
        }
    }

    onLoadImgUrbanPicture(event) {
        $(`#b_${event.target.id}`).remove();
    }
    async onErrorImgUrbanPicture(event) {
        await $.get(event.target.src).fail((obj) => {
            $(`#b_${event.target.id}`).remove();
            $(`<b id=b_${event.target.id} class="imgErrorText">${obj.responseText}</b>`).insertAfter(event.target);
        });
        /**<b class="imgErrorText">The Google Maps Platform server rejected your request. The provided API key is invalid.</b> */
        // event.target.innerHTML = '<b style="position:absolute; top:50%; left:50%;transform: translate(-50%, -50%);">The Google Maps Platform server rejected your request. The provided API key is invalid222.</b>'
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
        this.openLayersHandler.drawing = true;
        this.uiModel.createRegion(eventKey.feature, true);

        //Cancel drawing
        this.uiView.updateShapeToolView(null);
        this.openLayersHandler.SelectedDrawTool = null;
        this.openLayersHandler.drawing = false;
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

        this.uiModel.SelectedImageProvider = imageProvider;
        this.uiView.updateImageProviderView();
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
        //this.sessionManager.saveSession();
    }

    onGetImages(event) {
        try {

            let filterId = getPropPath(event, ['filterId']);
            if (this._streetSelected.lastSelectedFeature) {
                this.geoImageManager.updateDisplayingLayers(filterId,
                    GeoJSONHelper.writeFeature(this._streetSelected.lastSelectedFeature));
            }
            else {
                this.geoImageManager.updateDisplayingLayers(filterId);
            }
        } catch (error) {
            this.uiView.displayMessage(error, "Error");
        }
    }

    onFeatureUpdated(layerFeatureId) {
        let OLFeature = this.uiModel.featuresByLayerId[layerFeatureId.layerId.toString()][layerFeatureId.featureId].feature;
        this.openLayersHandler.redrawFeature(OLFeature);
    }

    onFeatureCreated(layerFeatureId) {
        this.uiView.updateLayersHintList();
        let OLFeature = this.uiModel.featuresByLayerId[layerFeatureId.layerId.toString()][layerFeatureId.featureId].feature;
        this.openLayersHandler.drawFeature(OLFeature);
    }

    onFeatureCollectionChange(regionLayer) {
        this.uiView.updateLayersHintList();
        if (regionLayer) {
            //this.uiModel.updateFeatureIndex(regionLayer.layerId.toString()); //Model commands should be before View commands
            this.uiView.drawRegionLayer(regionLayer, true);
        }
    }

    onFeaturesMerged(layer) {
        this.uiView.drawRegionLayer(layer, true);
    }

    onClickRegionListItem() {
        this.uiView.updateLayersHintList();
    }

    async onClickAddressBarBtn() {
        /**
        Implement a call to uiModel
        and at the uiModel implement an ajax request as
        described at the "Examples" in:
        https://nominatim.org/release-docs/develop/api/Search/
         */
        let address = this.uiView.jqtxtAddressBar.val();
        let addressResults = await this.uiModel.searchAddress(address);
        if (addressResults.length > 0) {
            let closestToMapCenterAddress = this.openLayersHandler.getClosestAddress(addressResults);
            this.openLayersHandler.centerMap([
                parseFloat(closestToMapCenterAddress.lon),
                parseFloat(closestToMapCenterAddress.lat)
            ]);
        }
        else {
            alert(gettext("Unfortunately the requested address could not be found."));
        }
    }

    onClickClearSelectionsBtn() {
        this.uiModel.SelectedMapMiner = null;
        this.uiModel.SelectedMapFeature = null;

        this.uiView.clearSelections();
    }

    async onClickSaveSessionBtn() {
        let currentSessionName = this.uiModel.currentSessionName;
        let sessionName = this.uiView.askSessionName(currentSessionName);
        await this.sessionManager.saveSession(sessionName);
    }

    async onClickNewSessionBtn() {
        try {
            this._streetSelected.clear();
            if (await this.sessionManager.newSession()) {
                this.uiView.updateGeoImgSlider();
                this.uiView.displayMessage(gettext("New blank session created!"));
            }
        } catch (error) {
            this.uiView.displayMessage(error, "Error");
        }

    }

    async onClickExecuteQueryBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteQuery);
        try {
            //await this.uiModel.executeQuery.bind(this.uiModel)();
            await this.uiModel.executeQuery();
        }
        finally {
            this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteQuery)
        }
    }

    async onClickExecuteImageFilterBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnExecuteImageFilter);

        try {
            await this.uiModel.getProcessedImages.bind(this.uiModel)()
            //Set the geoImageManager to display this collection

        }
        catch (err) {
            this.uiView.displayMessage(err, "Error");
        }
        finally {
            this.uiView.unsetLoadingText(this.uiView.jqbtnExecuteImageFilter)
        }
    }

    async onClickGetImagesBtn() {
        this.uiView.setLoadingText(this.uiView.jqbtnCollectImages);
        try {
            await this.uiModel.getImages(this.uiModel.SelectedImageProvider.id);
        }
        catch (err) {
            this.uiView.displayMessage(err.message, "Error");
        }
        finally {
            this.uiView.unsetLoadingText(this.uiView.jqbtnCollectImages)
        }
    }
}