/**
 * Responsible for displaying GeoImages from features
 * @module GeoImageManager
 */

/**
 * Responsible for displaying GeoImages
 * @param {string} DOMImageId - The id of the image element (from DOM) that will be used to display the collected GeoImages.
 * @param {UIModel} uiModel - Source of GIS features and GeoImages
 * @param {Object} [options] - Optional settings
 * @param {int} [options.autoPlayTimeInterval=3000] - Interval for autoplay (default 2 seconds)
 */
class GeoImageManager extends Subject {
    constructor(uiModel, options) {
        super();

        this.uiModel = uiModel;

        this._displayingLayers = [];

        this._currentGeoImagesCollection = [];
        this._currentLayer = -1;
        this._currentIndex = -1;
        this._validImages = -1;
        this._DOMImage = $('#imgUrbanPicture');

        this._autoPlayIntervalID = null;
        this._autoPlayState = 0;

        //null for original images
        this._imageFilterId = null;

        if (options && options.autoPlayTimeInterval) {
            this._autoPlayTimeInterval = options.autoPlayTimeInterval;
        }
        else {
            this._autoPlayTimeInterval = 2000; //2 seconds
        }
    }

    /**
     * Getter for [_validImages]{@link module:GeoImageManager~_validImages}; the number of valid images in the [_currentGeoImagesCollection]{@link module:GeoImageManager~_currentGeoImagesCollection}
     */
    get validImages() { return this._validImages; }
    /**
     * Which image is currently being displayed. Ranges from 0 to [_validImages]{@link module:GeoImageManager~_validImages}.
     */
    get currentIndex() { return this._currentIndex; }

    /**
     * Collects from [uiModel]{@link module:GeoImageManager~uiModel} all active layers with GeoImagesLoaded set to true.
     * @param {String} [filterId] - If set then all layers with processedImages with this filterId will be presented
     * instead of the raw images collected from some Image Provider
     * @todo What to do when there's no active layer? (Stop the current presentation?)
     */
    updateDisplayingLayers(filterId) {
        this._displayingLayers = this.uiModel.getDisplayingLayers();
        if (!this._displayingLayers.length > 0) return;
        this._currentLayer = 0;
        if (!this._setCurrentGeoImagesCollection(this._displayingLayers[layerIndex].featureCollection)) return;
        this._currentIndex = 0;
        this.imageFilterId = filterId;
        this.autoPlayGeoImages(GeoImageManager.PlayCommands.Play);
    }

    
    /**
     * Changes automatically the currently presented geoImage
     * @param {int} autoPlayNewState - Controls the state of GeoImageManager's autoplay
     * 0 - Stopped -> Will restart the GeoImageManager counter when started.
     * 1 - Playing -> Can be stopped (reseted) or paused.
     * 2 - Paused -> Will continue from the last presented GeoImage when restarted.
     * @returns {Boolean} - True if the state is changed correctly
     */
    autoPlayGeoImages(autoPlayNewState) {
        if (this._autoPlayState === autoPlayNewState) {
            console.warn(gettext("Tried to repeat GeoImageManager's autoplay state")+`: ${autoPlayNewState}`);
            return false;
        }
        else if (this._autoPlayState === 0 && autoPlayNewState === 2) {
            console.warn("Tried to pause autoplay while it was in the stopped state");
            return false;
        }

        if (this._autoPlayState === 0 && autoPlayNewState === 1) //Stopped -> Playing
        {
            this._autoPlayIntervalID = setInterval(function () {
                this.displayFeatures(false);
            }.bind(this), this._autoPlayTimeInterval);
        }
        else if (this._autoPlayState === 2 && autoPlayNewState === 1) //Paused -> Playing
        {
            this._autoPlayIntervalID = setInterval(function () {
                this.displayFeatures(false);
            }.bind(this), this._autoPlayTimeInterval);
        }
        else if ((this._autoPlayState === 1 || this._autoPlayState === 2) && (autoPlayNewState === 0 || autoPlayNewState === 2)) //Playing/Paused -> Stopped/Paused
        {
            clearInterval(this._autoPlayIntervalID);
        }
        else {
            console.error(`Unrecognized autoPlayNewState code: ${autoPlayNewState}.`);
            return false;
        }
        this._autoPlayState = autoPlayNewState
        return true;
    }

    /**
     * Check if object is a leaf (geoImage)
     * @private
     * @param {any} object - The object to be tested
     * @returns {Boolean} True if the object is not undefined nor an Array
     */
    _isLeaf(object) {
        return !!object && !(object instanceof Array);
    }

    /**
     * Get the geoImage from [_currentGeoImagesCollection]{@link module:GeoImageManager~_currentGeoImagesCollection} at "index" position.
     * Updates the [_validImages]{@link module:GeoImageManager~_validImages} property as a side effect when the index is greater than
     * the number of available images.
     * @private
     * @param {int} index - Starting index
     * @returns {GeoImage|int} Case the index is greater than the number of GeoImages then it returns the number of GeoImages
     */
    _getGeoImageAtIndex(index) {
        let ret = this._traverseCollection(this._currentGeoImagesCollection, index);
        if (typeof ret === "number") this._validImages = ret;
        return ret;
    }

    _countValidImages(root) {
        if (this._isLeaf(root)) {
            //return this._isValidJsonObject(root) ? 1 : 0;
            return (GeoImage.isGeoImageCompliant(root)) ? 1 : 0;
        }
        let n = 0;
        let count = 0;
        while (root[n]) {
            count += this._countValidImages(root[n]);
            n += 1;
        }
        return count;
    }

    _removeInvalidImages(root) {
        if (this._isLeaf(root)) {
            //return this._isValidJsonObject(root) ? 1 : 0;
            return (GeoImage.isGeoImageCompliant(root)) ? 1 : 0;
        }
        let n = 0;
        let count = 0;
        let oldCount = 0;
        while (root[n]) {
            count += this._removeInvalidImages(root[n]);
            if (count === oldCount) {
                root.splice(n, 1);
                n -= 1;
            }
            oldCount = count;
            n += 1;
        }
        return count;
    }


    /**
     * Traverses the GeoImages graph and select the leaf in the "index" position.
     * If "index" is greater than the number of leafs (geoImages) then it returns the number of leafs
     * @private
     * @param {Array} root - The graph of GeoImages
     * @param {int} index - Index of the desired leaf (geoImage)
     * @param {int} currentIndex - Should be zero (used by recursion)
     * @returns {Object|int} - The node or 1
     */
    _traverseCollection(root, index, currentIndex) {
        if (typeof currentIndex !== 'number') currentIndex = 0;
        if (this._isLeaf(root)) {
            if (currentIndex === index) {
                return root;
            }
            else {
                return 1;
            }
        }
        let n = 0;
        while (root[n]) {
            let k = this._traverseCollection(root[n], index - currentIndex, 0);
            if (typeof k !== 'number') return k;
            currentIndex += k;
            n += 1;
        }
        return currentIndex;

    }

    /**
     * Change the current GeoImage's Collection being presented
     * @param {FeatureCollection} newFeatureCollection - A feature collection object with its features containing the geoImages as a property
     * @todo If there was some features being presented before, treat the update
     * @fires [geoimagescollectionchange]{@link module:GeoImageManager~GeoImageManager.geoimagescollectionchange}
     * @returns {boolean} True if the change is successful, false if otherwise
     */
    _setCurrentGeoImagesCollection(newFeatureCollection) {
        if (!(newFeatureCollection && newFeatureCollection.features && newFeatureCollection.features.length > 0)) return false;

        this._currentGeoImagesCollection = [];
        for (let featureIndex in newFeatureCollection.features) {
            let feature = newFeatureCollection.features[featureIndex];
            let geoImages = feature.properties.geoImages;
            if (geoImages) {
                this._currentGeoImagesCollection.push(geoImages);
            }
        }
        let removedCount = this._removeInvalidImages(this._currentGeoImagesCollection);
        this._validImages = this._countValidImages(this._currentGeoImagesCollection);
        if (removedCount !== this._validImages)
            throw "removedCount different from this._validImages!";
        GeoImageManager.notify('geoimagescollectionchange', this._currentGeoImagesCollection);
        return true;
    }

    /**
     * Start the displaying of the current GeoImages collection
     * @todo Make the access to the image data more generic (e.g. without metadata)
     * @param {Boolean} fromStart - If true then the counter will be reset
     * @param {Boolean} startAutoPlay - Set a timer to change the images automatically
     * @fires [invalidcollection]{@link module:GeoImageManager~GeoImageManager.invalidcollection}
     * @fires [imagechange]{@link module:GeoImageManager~GeoImageManager.imagechange}
     * @returns {Boolean} - True if the state was changed correctly
     */
    displayFeatures(fromStart, startAutoPlay) {
        if (!this._currentGeoImagesCollection || this._currentGeoImagesCollection.length === 0) {
            console.warn("Error: Trying to display empty geoImages collection.");
            return false;
        }
        if (fromStart || (this._validImages < this._currentIndex)) this._currentIndex = -1;
        let geoImage = this._getNextImage();
        if (!geoImage) {
            GeoImageManager.notify('invalidcollection', null);
            return false;
        }
        this.displayGeoImage(geoImage);
        //if (geoImage.dataType === 'URL') {
        //    this._DOMImage.attr("src", geoImage.metadata.imageURL);
        //}
        //else if (geoImage.dataType === 'data:image/jpeg;base64') {
        //    this._DOMImage.attr("src", `${geoImage.dataType}, ${geoImage.data}`);
        //}
        //else
        //{
        //    throw new Error(`Unrecognized geoImage dataType: ${geoImage.dataType}`);
        //}
        GeoImageManager.notify('imagechange', geoImage);
        if (startAutoPlay) {
            this.autoPlayGeoImages(GeoImageManager.PlayCommands.Play);
        }

        return true;
    }

    displayFeatureAtIndex(index, silentChange) {
        if (index > this._validImages) {
            console.error(`Index (${index}) out of valid range [0-${this.validImages}]. `);
            return false;
        }
        //let geoImage = this._isValidJsonObject(this._getGeoImageAtIndex(index));
        let geoImage = this._getGeoImageAtIndex(index);
        //if (typeof geoImage === "number") {
        if (!GeoImage.isGeoImageCompliant(geoImage)) {
            throw "Tried to get an invalid image!";
        }
        //this._DOMImage.attr("src", geoImage.metadata.imageURL);
        //this._DOMImage.attr("src", geoImage.dataType + "," + geoImage.data);
        this.displayGeoImage(geoImage);
        if (!silentChange) GeoImageManager.notify('imagechange', geoImage);
        return true;

    }

    set imageFilterId(imageFilterId) {
        this._imageFilterId = imageFilterId;
    }

    displayGeoImage(geoImage) {
        if (this._imageFilterId && geoImage.processedDataList[this._imageFilterId]) {
            //This assumes that geoImage.dataType = 'data:image/jpeg;base64'
            this._DOMImage.attr("src", `${geoImage.processedDataList[this._imageFilterId].imageData}`);
        }
        else
        {
            if (geoImage.dataType === 'URL') {
                this._DOMImage.attr("src", geoImage.data);
            }
            else {
                throw new Error(`Unrecognized geoImage dataType: ${geoImage.dataType}`);
            }
        }
    }

    _getNextImage() {
        this._currentIndex += 1;
        let geoImage = this._findNextValidImage(this._currentIndex);

        //No more valid images, try from the beggining
        if (!(geoImage instanceof Object)) {
            geoImage = this._findNextValidImage(0);
            if (!geoImage) //There's no valid GeoImage in the entire GeoImage collection
            {
                //throw new Error("There's no valid GeoImage in the entire GeoImage collection.");
                console.error("There's no valid GeoImage in the entire GeoImage collection.");
                return null;
            }
        }
        return geoImage;
    }

    /**
     * Tries to find the next valid image starting from "startingIndex".
     * If some valid GeoImage is found the [_currentIndex]{@link module:GeoImageManager~_currentIndex} is set to the index of the GeoJson found.
     * @param {int} startingIndex - Start the search from this index (possibly zero) until the end of the GeoImage's collection
     * @returns {GeoImage|null} If no valid GeoImage is found then returns null.
     */
    _findNextValidImage(startingIndex) {
        let geoImage = this._getGeoImageAtIndex(startingIndex);
        //while (!(this._isValidJsonObject(geoImage)))//Try to find a valid image
        while (!(GeoImage.isGeoImageCompliant(geoImage)))
        {
            startingIndex += 1;
            //If _getGeoImageAtIndex returns a number then the collection has ended
            geoImage = this._getGeoImageAtIndex(startingIndex);
            if (typeof geoImage === 'number') //The collection was traversed from startingIndex to the end (no valid GeoImage could be found in this range)
            {
                return null;
            }
        }
        this._currentIndex = startingIndex;
        //return this._isValidJsonObject(geoImage);
        return geoImage;
    }

    /**
     * @param {string} testString - The string to be parsed or rejected
     * @returns {Object|False} If the 'testString' is a valid json object then it's returned otherwise "false" is returned.
     */
    //_isValidJsonObject(testString) {
    //    try {
    //        if (testString instanceof Object) return testString;
    //        let ret = JSON.parse(testString);
    //        if (ret instanceof Object) {
    //            return ret;
    //        }
    //        else {
    //            return false;
    //        }
    //    } catch (e) {
    //        return false;
    //    }
    //}

}

/**
* Triggered when MultiLineString Features are joined together
* @event module:GeoImageManager~GeoImageManager.imagechange
* @type {GeoImage}
* @property {GeoImage} geoimage - The currently displayed geoimage
*/

/**
* Triggered when GeoImagesCollection (the set of geo images) changes
* @event module:GeoImageManager~GeoImageManager.geoimagescollectionchange
* @type {GeoImage[]}
* @property {GeoImage} geoimage - The currently displayed geoimage
*/

/**
* Triggered while trying to display a GeoImage from a collection without any valid GeoImage.
* @event module:GeoImageManager~GeoImageManager.invalidcollection
*/

if (!GeoImageManager.init) {
    GeoImageManager.init = true;
    GeoImageManager.registerEventNames([
    'imagechange',
    'geoimagescollectionchange',
    'invalidcollection'
    ]);
    GeoImageManager.PlayCommands =
        {
            Stop: 0,
            Play: 1,
            Pause: 2
        };

}