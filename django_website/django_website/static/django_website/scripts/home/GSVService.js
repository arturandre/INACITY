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
                    async (streetViewPanoramaData) => await streetViewPanoramaData.toGeoImage(),
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

    static async imageURLBuilderForGeoImage(geoImage, size, key) {
        let _size = size || [640, 640];
        let _key = key || GSVService.defaultKey;
        let gsv_unsigned_url = GSVService.imageURLBuilder(
            _size,
            geoImage.id,
            geoImage.heading,
            geoImage.pitch,
            _key);
        
        if (!GSVService.SignURLs)
        {
            return gsv_unsigned_url;
        }

        
        return await $.ajax("/sign_gsv_url/",
            {
                method: "POST",
                processData: false,
                data: JSON.stringify({
                    'gsv_unsigned_url': gsv_unsigned_url
                }),
                contentType: "application/json; charset=utf-8",
                dataType: 'text',
                success: function (data, textStatus, XHR) {
                    return data;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    defaultAjaxErrorHandler('imageURLBuilderForGeoImage', textStatus, errorThrown);
                }
            });
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

    GSVService.SignURLs = false;

}
