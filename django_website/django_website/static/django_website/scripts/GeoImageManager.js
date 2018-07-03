/**
 * Responsible for displaying GeoImages from features
 * @module GeoImageManager
 */

/**
 * Responsible for displaying GeoImages from features.
 * @param {string} DOMImageId - The id of the image element (from DOM) that will be used to display the collected GeoImages.
 */
class GeoImageManager extends Subject{
    constructor(DOMImageId) {
        super();

        this._currentGeoImagesCollection = [];
        this._currentIndex = -1;
        this._maxIndex = -1;
        this._DOMImage = $(`#${DOMImageId}`);
    }

    /**
     * Check if object is a leaf (geoImage)
     * @private
     */
    _isLeaf(object)
    {
        return !!object && !(object instanceof Array);
    }

    /**
     * Get the geoImage from [_currentGeoImagesCollection]{@link module:GeoImageManager~_currentGeoImagesCollection} at "index" position.
     * Updates the [_maxIndex]{@link module:GeoImageManager~_maxIndex} property as a side effect when the index is greater than
     * the number of available images.
     * @private
     * @param {int} index
     * @returns {GeoImage|int} Case the index is greater than the number of GeoImages then it returns the number of GeoImages
     */
    _getGeoImageAtIndex(index)
    {
        let ret = this._traverseCollection(this._currentGeoImagesCollection, index);
        if (typeof ret === "number") this._maxIndex = ret;
        return ret;
    }

    /**
     * Traverses the GeoImages graph and select the leaf in the "index" position.
     * If "index" is greater than the number of leafs (geoImages) then it returns the number of leafs
     * @private
     * @param {Array} root - The graph of GeoImages
     * @param {int} index - Index of the desired leaf (geoImage)
     * @param {int} currentIndex - Should be zero (used by recursion)
     */
    _traverseCollection(root, index, currentIndex)
    {
        if (typeof currentIndex !== 'number') currentIndex = 0;
        if (this._isLeaf(root))
        {
            if (currentIndex === index)
            {
                return root;
            }
            else
            {
                return 1;
            }
        }
        let n = 0;
        while(root[n])
        {
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
     * @fires [geoimagescollectionchanged]{@link module:GeoImageManager~GeoImageManager.geoimagescollectionchanged}
     * @returns {boolean} True if the change is successful, false if otherwise
     */
    setCurrentGeoImagesCollection(newFeatureCollection) {
        if (!(newFeatureCollection && newFeatureCollection.features && newFeatureCollection.features.length > 0)) return false;
            
        this._currentGeoImagesCollection = [];
        for (let featureIndex in newFeatureCollection.features)
        {
            let feature = newFeatureCollection.features[featureIndex];
            let geoImages = feature.properties.geoImages;
            if (geoImages)
            {
                this._currentGeoImagesCollection.push(geoImages);
            }
        }
        GeoImageManager.notify('geoimagescollectionchanged', this._currentGeoImagesCollection);
        return true;
    }

    /**
     * Start the displaying of the current GeoImages collection
     * @todo Should the event 'imagechanged' have some parameter (instead of null)?
     * @todo Make the access to the image data more generic (e.g. without metadata)
     * @param {boolean} fromStart - If true then the counter will be reset
     * @fires [invalidcollection]{@link module:GeoImageManager~GeoImageManager.invalidcollection}
     * @fires [imagechanged]{@link module:GeoImageManager~GeoImageManager.imagechanged}
     */
    displayFeatures(fromStart) {
        if (!this._currentGeoImagesCollection || this._currentGeoImagesCollection.length == 0)
        {
            console.warn("Error: Trying to display empty geoImages collection.");
            return false;
        }
        if (fromStart || (this._maxIndex < this._currentIndex)) this._currentIndex = -1;
        let geoImage = this._getNextImage();
        if (!geoImage)
        {
            GeoImageManager.notify('invalidcollection', null);
            return false;
        }
        this._DOMImage.attr("src", geoImage.metadata.imageURL);
        GeoImageManager.notify('imagechanged', geoImage);
        return true;
    }

    _getNextImage()
    {
        this._currentIndex += 1;
        let geoImage = this._findNextValidImage(this._currentIndex);

        //No more valid images, try from the beggining
        if (!(geoImage instanceof Object))
        {
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
    _findNextValidImage(startingIndex)
    {
        let geoImage = this._getGeoImageAtIndex(startingIndex);
        while (!this._isValidJsonObject(geoImage))//Try to find a valid image
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
        return this._isValidJsonObject(geoImage);
    }

    /**
     * @returns {Object|False} If the 'testString' is a valid json object then it's returned otherwise "false" is returned.
     */
    _isValidJsonObject(testString)
    {
        try {
            let ret = JSON.parse(testString);
            if (ret instanceof Object)
            {
                return ret;
            }
            else
            {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

}

/**
* Triggered when MultiLineString Features are joined together
* @event module:GeoImageManager~GeoImageManager.imagechanged
* @type {GeoImage}
* @property {GeoImage} geoimage - The currently displayed geoimage
*/

/**
* Triggered when GeoImagesCollection (the set of geo images) changes
* @event module:GeoImageManager~GeoImageManager.geoimagescollectionchanged
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
    'imagechanged',
    'geoimagescollectionchanged',
    'invalidcollection'
    ]);
}