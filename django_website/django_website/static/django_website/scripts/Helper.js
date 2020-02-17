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
 * Traverses the GeoImages graph and select the leaf in the "index" position.
 * If "index" is greater than the number of leafs (geoImages) then it returns the number of leafs
 * @private
 * @param {Array} root - The graph of GeoImages
 * @param {int} index - Index of the desired leaf (geoImage)
 * @param {int} currentIndex - Should be zero (used by recursion)
 * @returns {Object|int} - The node or the number of nodes found (if index is greater than the total number of leaves)
 */
function traverseCollection(root, index, currentIndex = 0) {
    //if (typeof currentIndex !== 'number') currentIndex = 0;
    if (isLeaf(root)) {
        if (currentIndex === index) {
            return root;
        }
        else {
            return 1;
        }
    }
    let n = 0;
    let foundLeaves = 0;
    while (root[n]) {
        //let k = traverseCollection(root[n], index - currentIndex, 0);
        let k = traverseCollection(root[n], index, currentIndex + foundLeaves);
        if (typeof k !== 'number') return k;
        foundLeaves += k;
        n += 1;
    }
    return foundLeaves;
}