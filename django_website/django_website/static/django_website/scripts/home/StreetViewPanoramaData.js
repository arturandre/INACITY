/**
 * StreetViewPanoramaData module contains classes used by the StreetViewPanoramaData class.
 * This class encapsulates the data obtained by the StreetViewServices API related to a
 * panorama.
 * @module StreetViewPanoramaData
 */

/**
 * Each instance of this class represents a different
 * panorama for the a same location, but created in a
 * different moment (e.g. years ago).
 * @param {Date} [time.Af=null] - Time stamp (e.g. '2013-08-01T03:00:00.000Z')
 * @param {string} [time.ng=null] - Panorama id (e.g. 'eXUjXRg8uLIykI-z0BaL5w')
 */
class Time {
    constructor(parameters) 
    {
        var defaults = {
            kf: null,
            pano: null,
            Af: null, //deprecated
            ng: null //deprecated
        };
        parameters = parameters || defaults;
        this.Af = (parameters.Af || defaults.Af); //deprecated
        this.ng = (parameters.ng || defaults.ng); //deprecated
        this.kf = (parameters.kf || defaults.kf);
        this.pano = (parameters.pano || defaults.pano);
    }
}

/**
 * Each Link contains information to the panoramas directly connected to
 * the current StreetViewPanoramaData
 * @param {string} [description=null] - Simplified street address
 * @param {float} [heading=-1] - Heading angle of the vehicle
 * @param {string} [pano=null] - Panorama Id
 */
class Link
{
    constructor(parameters)
    {
        var defaults = {
            description: null,
            heading: -1,
            pano: null
        };
        parameters = parameters || defaults;
        this.description = (parameters.description || defaults.description);
        this.heading = (parameters.heading || defaults.heading);
        this.pano = (parameters.pano || defaults.pano);
    }
}

/**
* Class representing sizes for tileSize and worldSize
* @param {string} [b="px"] - Unknow
* @param {string} [f="px"] - Unknow
* @param {int} [height=512] - Height
* @param {int} [width=512]  - Width
*/
class gsvSize {
    constructor(parameters) {
        var defaults = {
            b: "px",
            f: "px",
            height: 512,
            width: 512
        };
        parameters = parameters || defaults;
        this.b = (parameters.b || defaults.b);
        this.f = (parameters.f || defaults.f);
        this.height = (parameters.height || defaults.height);
        this.width = (parameters.width || defaults.width);
    }
}

/**
 * Maybe this represents the data for the tiles
 * used to compose the panorama view
 * @param {float} [centerHeading=-1] - Heading (horizontal angle) of the vehicle
 * @param {float} [originHeading=-1] - Unknow (usually same as centerHeading)
 * @param {float} [originPitch=-1] - Pitch (vertical angle) of the vehicle
 * @param {gsvSize} [tileSize=null] - Maybe it's the size (in pixels) of the tile used to compose the panorama view
 * @param {gsvSize} [worldSize=null] - Unknow
 */
class Tile
{
    constructor(parameters)
    {
        var defaults = {
            centerHeading: -1,
            originHeading: -1,
            originPitch: -1,
            tileSize: null,
            worldSize: null
        };
        parameters = parameters || defaults;
        this.centerHeading = (parameters.centerHeading || defaults.centerHeading);
        this.originHeading = (parameters.originHeading || defaults.originHeading);
        this.originPitch = (parameters.originPitch || defaults.originPitch);
        this.tileSize = new gsvSize(parameters.tileSize || defaults.tileSize);
        this.worldSize = new gsvSize(parameters.worldSize || defaults.worldSize);
    }
}

/**
 * This class represents a location and contains
 * some description and the panorama id of this coordinate.
 * @param {float} [lon=0] - Longitude
 * @param {float} [lat=0] - Latitude
 * @param {string} [shortDescription=null] - Usually a simple address for this coordinate
 * @param {string} [description=null] - Usually the full address including the city
 * @param {string} [pano=null] - PanoramaId as reported by the API
 */
class LatLng
{
    constructor(parameters)
    {
        var defaults = {
            lon: 0,
            lat: 0,
            shortDescription: null,
            description: null,
            pano: null
        };
        parameters = parameters || defaults;

        this.lon = (parameters.lon || defaults.lon);
        this.lat = (parameters.lat || defaults.lat);
        this.shortDescription = (parameters.shortDescription || defaults.shortDescription);
        this.description = (parameters.description || defaults.description);
        this.pano = (parameters.pano || defaults.pano);
    }
}

/**
 * This class represents the panorama data retrieved by
 * the StreetViewService API.
 * @param {LatLng} [location=null] - Object used to keep track of the coordinates
 * @param {float} [location.lon=0] - Longitude
 * @param {float} [location.lat=0] - Latitude
 * @param {string} [location.shortDescription=null] - Usually a simple address for this coordinate
 * @param {string} [location.description=null] - Usually the full address including the city
 * @param {string} [location.pano=null] - PanoramaId as reported by the API
 * @param {string} [copyright=null] - Copyright data as informed by the API (e.g. '© 2018 Google')
 * @param {Link[]} [links=[]] - Array of panoramas connected to this one (for navigation)
 * @param {string} [links.description=null] - Simplified street address
 * @param {float} [links.heading=-1] - Heading angle of the vehicle
 * @param {string} [links.pano=null] - Panorama Id
 * @param {Tile} tiles=null - Tile data (used to compose the panorama view)
 * @param {float} [tiles.centerHeading=-1] - Heading (horizontal angle) of the vehicle
 * @param {float} [tiles.originHeading=-1] - Unknow (usually same as centerHeading)
 * @param {float} [tiles.originPitch=-1] - Pitch (vertical angle) of the vehicle
 * @param {gsvSize} [tiles.tileSize=null] - Maybe it's the size (in pixels) of the tile used to compose the panorama view
 * @param {gsvSize} [tiles.worldSize=null] - Unknow
 * @param {Time[]} [time=[]] - Others panoramas to this same location (used by Google's time machine)
 * @param {string} [time.Af=null] - Time stamp (e.g. '2013-08-01T03:00:00.000Z')
 * @param {string} [time.ng=null] - Panorama id (e.g. 'eXUjXRg8uLIykI-z0BaL5w')
 */
class StreetViewPanoramaData {
    constructor(parameters) {
        var defaults = {
            location: null,
            copyright: null,
            links: [],
            tiles: null,
            time: []
        };
        parameters = parameters || defaults;
        this.location = (parameters.LatLng || defaults.LatLng);
        this.copyright = (parameters.copyright || defaults.copyright);
        this.links = (parameters.links || defaults.links);
        this.tiles = (parameters.tiles || defaults.tiles);
        this.time = (parameters.time || defaults.time);
    }

    /**
     * @access public
     * @param {DataObject} data - Complex object returned by the StreetViewService API
     * @param {Google.LatLng} data.location - [Google's LatLng]{@link https://developers.google.com/maps/documentation/javascript/reference/3/coordinates#LatLng} object
     * @param {float} data.location.lat() - Latitude
     * @param {float} data.location.lng() - Longitude
     * @param {string} data.location.shortDescription - Simple street address
     * @param {string} data.location.description - Full street address
     * @param {string} data.location.pano - PanoramaId
     * @param {float} data.copyright - Google's copyright data
     * @param {Link[]} data.links - See [Link]{@link module:StreetViewPanoramaData~Link}
     * @param {Tile} data.tiles - See [Tile]{@link module:StreetViewPanoramaData~Tile}
     * @param {Time[]} data.time - See [Time]{@link module:StreetViewPanoramaData~Time}
     * @returns {StreetViewPanoramaData} - An instance fufilled of StreetViewPanoramaData
     * @see [Google's LatLng]{@link https://developers.google.com/maps/documentation/javascript/reference/3/coordinates#LatLng}
     */
    static fromStreetViewServiceData(data) {
        let newSVPano = new StreetViewPanoramaData();
        newSVPano.location = new LatLng({
            lon: data.location.latLng.lng(),
            lat: data.location.latLng.lat(),
            shortDescription: data.location.shortDescription,
            description: data.location.description,
            pano: data.location.pano
        });
        newSVPano.copyright = data.copyright;
        for (const linkIndex in data.links) newSVPano.links.push(new Link(data.links[linkIndex]));
        newSVPano.tiles = new Tile(data.tiles);
        for (const timeIndex in data.time) newSVPano.time.push(new Time(data.time[timeIndex]));
        return newSVPano;
    }

    async toGeoImage()
    {
        let ret = new GeoImage();
        ret.id = this.location.pano;
        //ret.location = this.location;
        //GeoJson Point specification
        ret.location = {
            type: 'Point',
            coordinates: [this.location.lon, this.location.lat]
        };

        ret.heading = this.tiles.centerHeading;
        ret.pitch = this.tiles.originPitch;
        ret.metadata = this;
        ret.data = await GSVService.imageURLBuilderForGeoImage(ret);
        ret.dataType = "URL";
        ret.metadata['imageURL'] = ret.data;
        return ret;
        
    }
}