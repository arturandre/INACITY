/**
     * Check if object is a leaf (geoImage)
     * @private
     * @param {any} object - The object to be tested
     * @returns {Boolean} True if the object is not undefined nor an Array
     */
    function isLeaf(object) {
        return !!object && !(object instanceof Array);
    }

/**
 * Given an DAG (Tree graph) root count how many leafs are GeoImages objects
 * @param {Graph} root - Represents the roots node from a tree (e.g. FeatureCollection)
 */
    function countValidImages(root) {
        if (isLeaf(root)) {
            //return isValidJsonObject(root) ? 1 : 0;
            return (GeoImage.isGeoImageCompliant(root)) ? 1 : 0;
        }
        let n = 0;
        let count = 0;
        while (root[n]) {
            count += countValidImages(root[n]);
            n += 1;
        }
        return count;
    }

/**
 * Given an DAG (Tree graph) root count how many leafs are GeoImages objects and remove leafs that aren't GeoImages
 * @param {Graph} root - Represents the roots node from a tree (e.g. FeatureCollection)
 */
    function removeInvalidImages(root) {
        if (isLeaf(root)) {
            return (GeoImage.isGeoImageCompliant(root)) ? 1 : 0;
        }
        let n = 0;
        let count = 0;
        let oldCount = 0;
        while (root[n]) {
            count += removeInvalidImages(root[n]);
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
     * @returns {Object|int} - The node or the number of nodes found (if index is greater than the total number of leaves)
     */
    function traverseCollection(root, index, currentIndex) {
        if (typeof currentIndex !== 'number') currentIndex = 0;
        if (isLeaf(root)) {
            if (currentIndex === index) {
                return root;
            }
            else {
                return 1;
            }
        }
        let n = 0;
        while (root[n]) {
            let k = traverseCollection(root[n], index - currentIndex, 0);
            if (typeof k !== 'number') return k;
            currentIndex += k;
            n += 1;
        }
        return currentIndex;

    }