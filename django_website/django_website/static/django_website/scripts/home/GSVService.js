class GSVService extends Subject
{
    constructor(defaultKey)
    {
        super();
        this.defaultKey = defaultKey;
    }



    /**
     * Auxiliar function to print errors caught.
     * @param {Error} err - {message: ..., stack: ...}
     * @param {string} locationDescription - String to indicate where the exception was caught
     */
    defaultError(err, locationDescription)
    {
        console.error(`Error caught at ${locationDescription}.`);
        console.error(err);
        throw err;
    }

    /**
     * Discover connected nodes through the links property in
     * StreetViewPanoramaData
     * @param {String} initialPanoId - Panorama ID of the initial node
     * @param {int} [maxIter=100] - Maximum number of nodes to be collected. Set -1 for unbounded.
     */
    static async crawlNodes(initialPanoId, maxIter = 100)
    {
        let currentData = null;
        let linksList = [];
        let progressIter = 0;
        let progressMax = maxIter;
        let progressCount = 0;


        currentData = await GSVService.getPanoramaById(initialPanoId);

        for (let link in currentData.links) linksList.push(currentData.links[link]);

        let nodes = {};
        nodes[currentData.location.pano] = currentData;

        //TESTING
        let startTime = new Date();
        let totalTime = 0;

        while (linksList.length > 0 && (maxIter > 0 || maxIter === -1))
        {
            let lastLink = linksList.pop();
            if (nodes[lastLink.pano]) continue;
            currentData = await GSVService.getPanoramaById(lastLink.pano);
            nodes[currentData.location.pano] = currentData;
            progressCount++;
            if (typeof (currentData) !== "object")
            {
                continue;
            }
            for (let link in currentData.links)
            {
                if (nodes[currentData.links[link].pano]) continue;
                linksList.push(currentData.links[link]);
            }
            if (maxIter > 0) maxIter--;
            progressIter++;
            if (progressIter % 100 === 0)
            {

                let endTime = new Date();
                var timeDiff = endTime - startTime; //in ms
                totalTime += timeDiff;
                console.log(`Time elapsed (ms): ${timeDiff}`);
                console.log(`Total elapsed (ms): ${totalTime}`);
                console.log(`progress: ${progressIter}/${progressMax}`);
                console.log(`Nodes collected: ${progressCount}`);
            }
        }
        return nodes;
    }


    /**
     * Return a StreetViewPanoramaData object whose id is panoId
     * @param {String} panoId - Panorama ID
     * @returns {Promise} - StreetViewPanoramaData
     */
    static getPanoramaById(panoId)
    {
        return new Promise(function (resolve, reject)
        {
            GSVService._streetViewService.getPanoramaById(panoId, function (data, status)
            {
                //resolve({ data: data, status: status });
                if (status === "OK")
                {
                    let parsedData = StreetViewPanoramaData.fromStreetViewServiceData(data);
                    resolve(parsedData);
                }
                else
                {
                    reject(status);
                }
            });
        });
    }

    /**
     * Return a StreetViewPanoramaData object from 
     * within a radius of [GSVService.maxRadius]{@link GSVService~maxRadius} lonLatCoordinate position if available.
     * @param {JSON} lonLatCoordinate - JSON containing coordinates.
     * @param {float} lonLatCoordinate.lon - Longitude in degrees
     * @param {float} lonLatCoordinate.lat - Latitude in degrees
     * @returns {Promise} - StreetViewPanoramaData
     */
    static getPanoramaByLocation(lonLatCoordinate, maxRadius = null)
    {
        if (!maxRadius) maxRadius = GSVService.maxRadius;
        return new Promise(function (resolve, reject)
        {
            let lon = lonLatCoordinate[0];
            let lat = lonLatCoordinate[1];
            let latlng = new google.maps.LatLng(lat, lon);
            //GSVService._streetViewService.getPanoramaByLocation(latlng, maxRadius, function (data, status)
            GSVService._streetViewService.getPanorama({ location: latlng, preference: 'nearest', radius: maxRadius, source: 'outdoor' }, function (data, status)
            {
                //resolve({ data: data, status: status });
                if (status === "OK")
                {
                    let parsedData = StreetViewPanoramaData.fromStreetViewServiceData(data);
                    resolve(parsedData);
                }
                else if (status === "ZERO_RESULTS")
                {
                    resolve(status);
                }
                else
                {
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

    static async setPanoramaForFeatureCollection(featureCollection)
    {
        const promises = featureCollection.features.map(GSVService.setPanoramaForFeature);
        await Promise.all(promises);
    }

    //Works in-place
    static async setPanoramaForFeature(feature)
    {
        let pointAtCoordinate = false;
        if (
            feature.geometry.type.toLowerCase() === "multipoint"
            || feature.geometry.type.toLowerCase() === "point"
        )
        {
            pointAtCoordinate = true;
        }
        feature.properties.geoImages = await GSVService.cloneTree(feature.geometry.coordinates,
            /*Not leaf function*/ undefined,
            /*Leaf function*/ async function (node)
            {
                return await GSVService.getPanoramaByLocation(node).then(
                    async function (streetViewPanoramaData)
                    {
                        if (typeof (streetViewPanoramaData) === "string")
                        {
                            return streetViewPanoramaData;
                        }
                        else
                        {
                            return await streetViewPanoramaData.toGeoImage(node, pointAtCoordinate);
                        }
                    },
                    function (err)
                    {
                        console.error(err);
                        return "Error";
                    }
                );
            });
        console.log("Tree cloned");
    }

    //Pre-order tree traversal
    //static async cloneTree(root, notLeafFunction, LeafFunction, parent) {
    static async cloneTree(root, notLeafFunction, LeafFunction)
    {
        if (!root) return;
        let newRoot = [];
        let index = 0;
        //Not leaf
        if (root[0][0] !== undefined)
        {
            if (notLeafFunction)
            {
                newRoot = await notLeafFunction(root);
            }
            let nextNode = root[index];
            do
            {
                //newRoot.push(await GSVService.cloneTree(nextNode, notLeafFunction, LeafFunction, root));
                newRoot.push(await GSVService.cloneTree(nextNode, notLeafFunction, LeafFunction));
                index += 1;
                nextNode = root[index];

            }
            while (nextNode);
        }
        //Leaf
        else
        {
            if (LeafFunction)
            {
                try
                {
                    newRoot = await LeafFunction(root);
                } catch (error)
                {
                    newRoot = "Error";
                    console.error(error);
                }

            }
        }
        return newRoot;
    }

    //static async imageURLBuilderForGeoImage(geoImage, key, size)
    async imageURLBuilderForGeoImage(geoImage, key, size)
    {
        let _size = size || [640, 640];
        let _key = key || this.defaultKey;
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

        if (GSVService.SignURLs &&
            !use_alternative_gsv_signing_secret &&
            GSVService.out_of_quota)
        {
            GSVService.notify('outofquota');
            return false;
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
                success: function (data, textStatus, XHR)
                {
                    return data;
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    if ((jqXHR.status === 403)
                        && (jqXHR.responseText === "out_of_quota_message"))
                    {
                        GSVService.out_of_quota = true;
                        GSVService.notify('outofquota');
                    }
                    else
                    {
                        defaultAjaxErrorHandler('imageURLBuilderForGeoImage', textStatus, errorThrown);
                    }
                }
            });
    }

    static imageURLBuilder(size, panoid, heading, pitch, key)
    {
        return `${GSVService.baseurl}${GSVService.queryStringBuilderPanorama(size, panoid, heading, pitch, key)}`;
    }

    static queryStringBuilderPanorama(size, panoid, heading, pitch, key)
    {
        return `?size=${size[0]}x${size[1]}&pano=${panoid}&heading=${heading}&pitch=${pitch}&key=${key}`;
    }
}

if (!GSVService.init)
{
    GSVService.init = true;
    GSVService.baseurl = "https://maps.googleapis.com/maps/api/streetview";

    /**
    * StreetViewService component used to collect the panoramas.
    * The google.maps.StreetViewService is loaded by the script
    * http://m aps.google.com/maps/api/js 
    *  So that script needs to be loaded before the GSVService.js script
    * @see StreetViewPanoramaData
    * @const {google.maps.StreetViewService}
    */
    GSVService._streetViewService = new google.maps.StreetViewService();

    /** 
    * Used to define the radius of the area, around given location, to search for a panorama. 
    * @see [getPanoramaByLocation]{@link module:node/routes/index~getPanoramaByLocation}.
        * @const {int} 
    */
    GSVService.maxRadius = 10;

    /**
     * The backend must sign the url if the user is providing
     * both a signing key and an API key or if
     * the user is using the default API and sining key,
     * any other case must no be signed, that happens
     * when the user is using his API key without a signing key or
     * vice-versa.
     */
    GSVService.SignURLs =
        (use_alternative_gsv_signing_secret == use_alternative_gsv_api_key);
    GSVService.out_of_quota = false;

    GSVService.registerEventNames([
        'outofquota'
    ]);
}
