/**
* StreetViewService component used to collect the panoramas
* @see StreetViewPanoramaData
* @const {google.maps.StreetViewService}
*/
const streetViewService = new google.maps.StreetViewService();
/** 
* Used to define the radius of the area, around given location, to search for a panorama. 
* @see [getPanoramaByLocation]{@link module:node/routes/index~getPanoramaByLocation}.
* @const {int} 
*/
const maxRadius = 10;

/**
 * Auxiliar function to print errors caught.
 * @param {Error} err - {message: ..., stack: ...}
 * @param {string} locationDescription - String to indicate where the exception was caught
 */
function defaultError(err, locationDescription) {
    console.error(`Error caught at ${locationDescription}.`);
    console.error(err);
    throw err;
}

/**
 * Return a StreetViewPanoramaData object from 
 * within a radius of [maxRadius]{@link module:node/routes/index~maxRadius} lonLatCoordinate position if available.
 * @param {JSON} lonLatCoordinate - JSON containing coordinates.
 * @param {float} lonLatCoordinate.lon - Longitude in degrees
 * @param {float} lonLatCoordinate.lat - Latitude in degrees
 */
function getPanoramaByLocation(lonLatCoordinate) {
    return new Promise(function (resolve, reject) {
        let lon = lonLatCoordinate[0];
        let lat = lonLatCoordinate[1];
        let latlng = new google.maps.LatLng(lat, lon);
        streetViewService.getPanoramaByLocation(latlng, maxRadius, function (data, status) {
            //resolve({ data: data, status: status });
            if (status === "OK") {
                let parsedData = StreetViewPanoramaData.fromStreetViewServiceData(data);
                resolve(parsedData);
            }
            else {
                reject(status);
            }

        });
    });
}

/**
 * Receives a [GeoJson Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2}
 * (not a FeatureCollection) and for each of its coordinates tries to find a panorama.
 * This function returns the input feature with a new property(geoImages)
 * with the same structure as the coordinates property and each value represents
 * a StreetViewPanoramaData for each coordinate. e.g.:
 * features[0].properties.geoImages[x][y][z] corresponds to the coordinate at
 * features[0].coordinates[x][y][z]
 * @param {Feature} feature - [GeoJson Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2}
 * object with one or more coordinates
 * @returns {Promise} Promise object with the input feature with a new property (geoImages).
 */
function getPanoramaForFeature(feature, featureIndex) {
    return new Promise(function (resolve, reject) {
        let geometryType = feature.geometry.type;

        let coordinates = feature.geometry.coordinates;
        let geoImages = feature.properties.geoImages = new Array();
        let numCalls = 0;
        if (geometryType === "MultiPolygon") {
            //Number of Polygons
            for (let i = 0; i < coordinates.length; i++) {
                geoImages[i] = new Array(coordinates[i].length);
                //Number of LineStrings/Linear Rings
                for (let j = 0; j < coordinates[i].length; j++) {
                    let coordsLen = coordinates[i][j].length;
                    numCalls += coordsLen;
                    geoImages[i][j] = new Array(coordsLen);
                    //Number of coordinates [(lon, lat)]
                    for (let k = 0; k < coordsLen; j++) {
                        let lonLatCoordinate = coordinates[i][j];
                        setGeoImageForLonLatCoordinate(lonLatCoordinate, geoImages[i][j], k);
                    }
                }
            }
        }
        else if (
            geometryType === "MultiLineString" ||
            geometryType === "Polygon"
        ) {
            //Number of LineStrings/Linear Rings
            for (let i = 0; i < coordinates.length; i++) {   //Number of coordinates [(lon, lat)]
                let coordsLen = coordinates[i].length;
                geoImages[i] = new Array(coordsLen);
                numCalls += coordsLen;
                for (let j = 0; j < coordsLen; j++) {
                    let lonLatCoordinate = coordinates[i][j];
                    setGeoImageForLonLatCoordinate(lonLatCoordinate, geoImages[i], j);
                }
            }
        }
        else if (geometryType === "LineString" || geometryType === "MultiPoint") {
            let coordsLen = coordinates.length;
            numCalls = coordsLen;
            //Number of coordinates [(lon, lat)]
            for (let i = 0; i < coordsLen; i++) {
                let lonLatCoordinate = coordinates[i];
                setGeoImageForLonLatCoordinate(lonLatCoordinate, geoImages, i);
            }
        }
        else if (geometryType === "Point") {
            numCalls = 1;
            let lonLatCoordinate = coordinates;
            setGeoImageForLonLatCoordinate(lonLatCoordinate, geoImages, 0);
        }
        else {
            console.error(`Geometry type (${geometryType}) not recognized!`);
            reject(`Geometry type (${geometryType}) not recognized!`);
        }
    });
}

//Works in-place
async function setPanoramaForFeature(feature) {
    feature.properties.geoImages = await cloneTree(feature.geometry.coordinates,
        /*Not leaf function*/ undefined, 
        /*Leaf function*/ async function(node) { 
            return await getPanoramaByLocation(node).then(
                (streetViewPanoramaData) => streetViewPanoramaData,
                (err) => err
                );
        });
    console.log("Tree cloned");
}

//Pre-order tree traversal
async function cloneTree(root, notLeafFunction, LeafFunction, parent) {
    if (!root) return;
    let newRoot = [];
    let index = 0;
    //Not leaf
    if (root[0][0]) {
        if (notLeafFunction) {
            newRoot = notLeafFunction(root);
        }

        //root.parent = parent;
        //root.marked = true;
        let nextNode = root[index++];
        do {
            newRoot.push(await cloneTree(nextNode, notLeafFunction, LeafFunction, root));
            nextNode = root[index++];
        }
        while (nextNode);
    }
        //Leaf
    else {
        if (LeafFunction) {
            newRoot = LeafFunction(root);
        }
    }
    return newRoot;
}


/** Inner function used to avoid code duplication */
function setGeoImageForLonLatCoordinate(lonLatCoordinate, geoImagesArray, position) {
    let p = getPanoramaByLocation(lonLatCoordinate);
    p.then(
        function (streetViewPanoramaData) {
            geoImagesArray[position] = streetViewPanoramaData;
        },
        function (failedStatus) {
            geoImagesArray[position] = failedStatus;
            console.warn(`Status for coordinates(lon: ${lonLatCoordinate[0]}, lat: ${lonLatCoordinate[1]}): ${failedStatus}`);
        }
    )
        .catch(
        function (err) {
            defaultError(err, "getPanoramaForFeature");
            throw new Error(err);
        }
        )
        .finally(
        function () {

            numCalls -= 1;
            if (numCalls == 0) {
                resolve([feature, featureIndex]);
            }
        }
        );

}

/**
 * This function receives a collection (array) of "Data" objects obtained
 * through the StreetViewService API and returns a collection of
 * StreetViewPanoramaData.
 * @param {StreetViewResponse[]} gsvArrayOfData - [{data: ..., status: 'OK' }]
 * @param {DataObject} StreetViewResponse.data - Data object from StreetViewService API to be converted to StreetViewPanoramaData.
 * @param {string} StreetViewResponse.status - String indicating the status of the request. Can be 'OK' for successfull requests, 'NOTFOUNT' if there's not a panorama within a radius of [maxRadius]{@link module:node/routes/index~maxRadius} from the [location] used in the request.
 */
function formatStreetViewPanoramaDataArray(gsvArrayOfData) {
    let ret = [];
    for (let coordIdx = 0; coordIdx < gsvArrayOfData.length; coordIdx++) {
        let coord = gsvArrayOfData[coordIdx];
        if (coord.status === "OK") {
            ret.push(StreetViewPanoramaData.fromStreetViewServiceData(coord.data));
        }
        else {
            continue;
        }
    }
    return ret;
}

/**
 * Collects panoramas for [Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2} in a [FeatureCollection]{@link https://tools.ietf.org/html/rfc7946#section-3.3} or for a single [Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2} from the geojson parameter.
 * @name collectfcpanoramas
 * @param {Feature|FeatureColletion} GeoJson's [FeatureCollection]{@link https://tools.ietf.org/html/rfc7946#section-3.3} or [Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2}
 */
function collectfcpanoramas(geojson) {
    return new Promise(function (resolve, reject) {
        if (geojson.type === 'Feature') {
            getPanoramaForFeature(geojson).then(
                function (featureAndIndex) { /* Index will be null in this case */
                    let featureWithGeoImage = featureAndIndex[0];
                    let jsonString = JSON.stringify(featureWithGeoImage);
                    resolve(jsonString);
                }, (err) => { defaultError(err, "collectfcpanoramas"); reject(err); }
            );
        }
        else if (geojson.type === 'FeatureCollection') {
            let features = geojson.features;
            let nCalls = features.length;
            for (let featureIdx = 0; featureIdx < features.length; featureIdx++) {
                getPanoramaForFeature(features[featureIdx], featureIdx)
                    .then(
                    function (featureAndIndex) {
                        let featureWithGeoImage = featureAndIndex[0];
                        let featureIdx = featureAndIndex[1];
                        geojson.features[featureIdx] = featureWithGeoImage;
                        nCalls -= 1;
                        if (nCalls == 0) {
                            let jsonString = JSON.stringify(geojson);
                            resolve(jsonString);
                        }
                    }, (err) => { defaultError(err, "collectfcpanoramas"); reject(err); }
                    );
            }
        }
        else {
            let err = "Geojson type unaccepted. Acceptable types: 'Feature', 'FeatureCollection'.";
            defaultError(err, "collectfcpanoramas");
            reject(err);
        }
    });
    console.log(geojson);
}