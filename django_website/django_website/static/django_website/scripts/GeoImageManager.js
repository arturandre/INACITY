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
     * Get the geoImage from [_currentGeoImagesCollection]{@link module:GeoImageManager~_currentGeoImagesCollection} at "index" position
     * @private
     * @param {int} index
     * @returns {GeoImage|int} Case the index is greater than the number of GeoImages then it returns the number of GeoImages
     */
    _getGeoImageAtIndex(index)
    {
        let ret = this._traverseCollection(this._currentGeoImagesCollection, index);
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
            let k = this._traverseCollection(root[n], currentIndex);
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
     * @todo should there be an event for changing the collection of images?
     */
    setCurrentGeoImagesCollection(newFeatureCollection) {
        this._currentGeoImagesCollection = [];
        for (const featureIndex in newFeatureCollection.features)
        {
            let feature = newFeatureCollection.features[featureIndex];
            let geoImages = feature.properties.geoImages;
            if (geoImages)
            {
                this._currentGeoImagesCollection.push(geoImages);
            }
        }
        
    }

    /**
     * Start the displaying of the current GeoImages collection
     * @todo Should the event 'imagechanged' have some parameter (instead of null)?
     * @todo Make the access to the image data more generic (e.g. without metadata)
     */
    displayFeatures(fromStart) {
        if (!this._currentGeoImagesCollection || this._currentGeoImagesCollection.length == 0)
        {
            console.warn("Error: Trying to display empty geoImages collection.");
            return false;
        }
        if (fromStart) this._currentIndex = -1;
        let geoImage = this._getNextImage();
        
        this._DOMImage.attr("src", geoImage.metadata.imageURL);
        GeoImageManager.notify('imagechanged', null);
    }

    _getNextImage()
    {
        this._currentIndex += 1;
        let geoImage = this._findNextValidImage(this._currentIndex);

        //No more valid images, try from the beggining
        if (!geoImage instanceof Object)
        {
            geoImage = _findNextValidImage(0);
            if (!geoImage) //There's no valid GeoImage in the entire GeoImage collection
            {
                throw new Error("There's no valid GeoImage in the entire GeoImage collection.");
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
* @property {boolean} layer.active - Indicates if this layers is currently active (e.g. drawed over the map)
* @property {string} layer.id - The id is represented by the Map Miner concatenated with the Geographic Feature Type by an underscore (e.g. OSMMiner_Streets).
* @property {string} layer.featureCollection - Represents all the geographical features (e.g. Streets) in this layer
*/

if (!GeoImageManager.init) {
    GeoImageManager.init = true;
    GeoImageManager.registerEventNames([
    'imagechanged',
    ]);
}