class GeoImageCollection {
    constructor(){
        this._currentGeoImagesCollection = [];
        this._validImages = -1;
    }

    loadFromJSON(geoImageCollectionSession) {
        this._validImages = geoImageCollectionSession._validImages;
    }

    saveToJSON() {
        let ret =
        {
            _validImages: this._validImages,
        };

        return ret;
    }

    loadGeoImagesFromFeatureCollection(newFeatureCollection)
    {
        this._currentGeoImagesCollection = [];
        if (newFeatureCollection && newFeatureCollection.features && newFeatureCollection.features.length > 0) {
            for (let featureIndex in newFeatureCollection.features) {
                let feature = newFeatureCollection.features[featureIndex];
                let geoImages = feature.properties.geoImages;
                if (geoImages) {
                    this._currentGeoImagesCollection.push(geoImages);
                }
            }
            this._cleanGeoImagesCollection();
        }
    }

    /**
     * Getter for [_validImages]{@link module:GeoImageManager~_validImages}; the number of valid images in the [_currentGeoImagesCollection]{@link module:GeoImageManager~_currentGeoImagesCollection}
     */
    get validImages() { return this._validImages; }


    /**
     * Given an DAG (Tree graph) or a GeoImage checks if it has some processed collection
     * @param {Graph} root - Root node from a tree (e.g. FeatureCollection)
     * @param {String} filterName - Image processing filter name (e.g. greenery)
     */
    static isFiltered(root, filterId) {
        while (!isLeaf(root)) {
            root = root[0];
        }
        if (GeoImage.isGeoImageCompliant(root)) {
            root = GeoImage.fromObject(root);
            return root.processedDataList && (filterId in root.processedDataList);
        }
        throw "Root should be an tree-like structure whose leaves are GeoImage";
    }

    /**
 * Given an DAG (Tree graph) root count how many leafs are GeoImages objects
 * @param {Graph} root - Represents the roots node from a tree (e.g. FeatureCollection)
 */
    static countValidImages(root) {
        if (isLeaf(root)) {
            //return isValidJsonObject(root) ? 1 : 0;
            return (GeoImage.isGeoImageCompliant(root)) ? 1 : 0;
        }
        let n = 0;
        let count = 0;
        while (root[n]) {
            count += GeoImageCollection.countValidImages(root[n]);
            n += 1;
        }
        return count;
    }
    /**
     * Given an DAG (Tree graph) root count how many leafs are GeoImages objects and remove leafs that aren't GeoImages
     * @param {Graph} root - Root node from a tree (e.g. FeatureCollection)
     */
    static removeInvalidImages(root) {
        if (isLeaf(root)) {
            return (GeoImage.isGeoImageCompliant(root)) ? 1 : 0;
        }
        let n = 0;
        let count = 0;
        let oldCount = 0;
        while (root[n]) {
            count += GeoImageCollection.removeInvalidImages(root[n]);
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
     * Get the geoImage from [_currentGeoImagesCollection]{@link module:GeoImageManager~_currentGeoImagesCollection} at "index" position.
     * Updates the [_validImages]{@link module:GeoImageManager~_validImages} property as a side effect when the index is greater than
     * the number of available images.
     * @private
     * @param {int} index - Starting index
     * @returns {GeoImage}
     */
    getGeoImageAtIndex(index) {
        let ret = traverseCollection(this._currentGeoImagesCollection, index);
        if (typeof ret === "number") {
            throw new Error(`GeoImage at index ${index} is out of the valid limit: ${this._validImages}`);
        }
        return GeoImage.fromObject(ret);
    }

    _cleanGeoImagesCollection() {
        let removedCount = GeoImageCollection.removeInvalidImages(this._currentGeoImagesCollection);
        this._validImages = GeoImageCollection.countValidImages(this._currentGeoImagesCollection);
        if (removedCount !== this._validImages)
            throw "removedCount different from this._validImages!";
    }
}