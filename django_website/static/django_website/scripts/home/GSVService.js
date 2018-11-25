class GSVService {
    /**
     * Auxiliar function to print errors caught.
     * @param {Error} err - {message: ..., stack: ...}
     * @param {string} locationDescription - String to indicate where the exception was caught
     */
    defaultError(err, locationDescription) {
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
     * @returns {Promise} - StreetViewPanoramaData
     */
    static getPanoramaByLocation(lonLatCoordinate) {
        return new Promise(function (resolve, reject) {
            let lon = lonLatCoordinate[0];
            let lat = lonLatCoordinate[1];
            let latlng = new google.maps.LatLng(lat, lon);
            GSVService.streetViewService.getPanoramaByLocation(latlng, GSVService.maxRadius, function (data, status) {
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
     * @returns {null} The input feature is changed in place receiving a new property (geoImages).
     */

    static async setPanoramaForFeatureCollection(featureCollection) {
        const promises = featureCollection.features.map(GSVService.setPanoramaForFeature);
        await Promise.all(promises);
    }

    //Works in-place
    static async setPanoramaForFeature(feature) {
        feature.properties.geoImages = await GSVService.cloneTree(feature.geometry.coordinates,
            /*Not leaf function*/ undefined,
            /*Leaf function*/ async function (node) {
                return await GSVService.getPanoramaByLocation(node).then(
                    (streetViewPanoramaData) => streetViewPanoramaData.toGeoImage(),
                    (err) => err
                );
            });
        console.log("Tree cloned");
    }

    //Pre-order tree traversal
    static async cloneTree(root, notLeafFunction, LeafFunction, parent) {
        if (!root) return;
        let newRoot = [];
        let index = 0;
        //Not leaf
        if (root[0][0]) {
            if (notLeafFunction) {
                newRoot = notLeafFunction(root);
            }
            let nextNode = root[index++];
            do {
                newRoot.push(await GSVService.cloneTree(nextNode, notLeafFunction, LeafFunction, root));
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


    
    //static setGeoImageForLonLatCoordinate(lonLatCoordinate, geoImagesArray, position) {
    //    let p = GSVService.getPanoramaByLocation(lonLatCoordinate);
    //    p.then(
    //        function (streetViewPanoramaData) {
    //            geoImagesArray[position] = streetViewPanoramaData;
    //        },
    //        function (failedStatus) {
    //            geoImagesArray[position] = failedStatus;
    //            console.warn(`Status for coordinates(lon: ${lonLatCoordinate[0]}, lat: ${lonLatCoordinate[1]}): ${failedStatus}`);
    //        }
    //    )
    //        .catch(
    //            function (err) {
    //                defaultError(err, "getPanoramaForFeature");
    //                throw new Error(err);
    //            }
    //        )
    //        .finally(
    //            function () {

    //                numCalls -= 1;
    //                if (numCalls == 0) {
    //                    resolve([feature, featureIndex]);
    //                }
    //            }
    //        );

    //}

    ///**
    // * This function receives a collection (array) of "Data" objects obtained
    // * through the StreetViewService API and returns a collection of
    // * StreetViewPanoramaData.
    // * @param {StreetViewResponse[]} gsvArrayOfData - [{data: ..., status: 'OK' }]
    // * @param {DataObject} StreetViewResponse.data - Data object from StreetViewService API to be converted to StreetViewPanoramaData.
    // * @param {string} StreetViewResponse.status - String indicating the status of the request. Can be 'OK' for successfull requests, 'NOTFOUNT' if there's not a panorama within a radius of [maxRadius]{@link module:node/routes/index~maxRadius} from the [location] used in the request.
    // */
    //static formatStreetViewPanoramaDataArray(gsvArrayOfData) {
    //    let ret = [];
    //    for (let coordIdx = 0; coordIdx < gsvArrayOfData.length; coordIdx++) {
    //        let coord = gsvArrayOfData[coordIdx];
    //        if (coord.status === "OK") {
    //            ret.push(StreetViewPanoramaData.fromStreetViewServiceData(coord.data));
    //        }
    //        else {
    //            continue;
    //        }
    //    }
    //    return ret;
    //}

    ///**
    // * Collects panoramas for [Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2} in a [FeatureCollection]{@link https://tools.ietf.org/html/rfc7946#section-3.3} or for a single [Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2} from the geojson parameter.
    // * @name collectfcpanoramas
    // * @param {Feature|FeatureColletion} GeoJson's [FeatureCollection]{@link https://tools.ietf.org/html/rfc7946#section-3.3} or [Feature]{@link https://tools.ietf.org/html/rfc7946#section-3.2}
    // */
    //static collectfcpanoramas(geojson) {
    //    return new Promise(function (resolve, reject) {
    //        if (geojson.type === 'Feature') {
    //            getPanoramaForFeature(geojson).then(
    //                function (featureAndIndex) { /* Index will be null in this case */
    //                    let featureWithGeoImage = featureAndIndex[0];
    //                    let jsonString = JSON.stringify(featureWithGeoImage);
    //                    resolve(jsonString);
    //                }, (err) => { defaultError(err, "collectfcpanoramas"); reject(err); }
    //            );
    //        }
    //        else if (geojson.type === 'FeatureCollection') {
    //            let features = geojson.features;
    //            let nCalls = features.length;
    //            for (let featureIdx = 0; featureIdx < features.length; featureIdx++) {
    //                getPanoramaForFeature(features[featureIdx], featureIdx)
    //                    .then(
    //                        function (featureAndIndex) {
    //                            let featureWithGeoImage = featureAndIndex[0];
    //                            let featureIdx = featureAndIndex[1];
    //                            geojson.features[featureIdx] = featureWithGeoImage;
    //                            nCalls -= 1;
    //                            if (nCalls == 0) {
    //                                let jsonString = JSON.stringify(geojson);
    //                                resolve(jsonString);
    //                            }
    //                        }, (err) => { defaultError(err, "collectfcpanoramas"); reject(err); }
    //                    );
    //            }
    //        }
    //        else {
    //            let err = "Geojson type unaccepted. Acceptable types: 'Feature', 'FeatureCollection'.";
    //            defaultError(err, "collectfcpanoramas");
    //            reject(err);
    //        }
    //    });
    //    console.log(geojson);
    //}

    static imageURLBuilderForGeoImage(geoImage, size, key) {
        let _size = size || [640, 640];
        let _key = key || GSVService.defaultKey;
        return GSVService.imageURLBuilder(
            _size,
            geoImage.id,
            geoImage.heading,
            geoImage.pitch,
            _key);
    }
    static imageURLBuilder(size, panoid, heading, pitch, key) {
        return `${GSVService.baseurl}${GSVService.queryStringBuilderPanorama(size, panoid, heading, pitch, key)}`;
    }

    static queryStringBuilderPanorama(size, panoid, heading, pitch, key) { 
        return `?size=${size[0]}x${size[1]}&pano=${panoid}&heading=${heading}&pitch=${pitch}&key=${key}`;
    }
}

if (!GSVService.init) {
    GSVService.init = true;
    GSVService.defaultKey = 'AIzaSyD5HdIiGhBEap1V9hHPjhq87wB07Swg-Gc';
    GSVService.baseurl = "https://maps.googleapis.com/maps/api/streetview";

    /**
    * StreetViewService component used to collect the panoramas
    * @see StreetViewPanoramaData
    * @const {google.maps.StreetViewService}
    */
    GSVService.streetViewService = new google.maps.StreetViewService();

    /** 
    * Used to define the radius of the area, around given location, to search for a panorama. 
    * @see [getPanoramaByLocation]{@link module:node/routes/index~getPanoramaByLocation}.
    * @const {int} 
    */
    GSVService.maxRadius = 10;

}
