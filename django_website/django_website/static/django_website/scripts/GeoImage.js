/**
 * Responsible for displaying GeoImages from features
 * @module GeoImage
 */

/**
 * Responsible for displaying GeoImages
 * @param {string} id - The id of the image element (from DOM) that will be used to display the collected GeoImages.
 * @param {LatLng} location - Location of the GeoImage
 * @param {string} location.description - Decription about this location (i.e. address)
 * @param {string} location.shortDescription - Short decription about this location (i.e. address)
 * @param {float} location.lat - Latitude in the projection adopted (i.e. )
 * @param {float} location.lon - Decription about this location (i.e. address)
 * @param {string} location.pano - Decription about this location (i.e. address)
 * 
 * @param {float} heading - Horizontal angle of the camera
 * @param {float} pitch - Vertical angle of the camera
 * @param {Object} metadata - Depends on the provider, but may include timestamp for example
 * @param {string} data - May contain either a base64 string with an image, or an url for an image
 * @param {string} dataType - Defines if the data field is a base64 or an "URL"
 * @param {Array} processedDataList - Contains ProcessedImages
*/
class GeoImage
{
    constructor() {
        this.id = null;
        this.location = null;
        this.heading = null;
        this.pitch = null;
        this.metadata = null;
        this.data = null;
        this.dataType = null;
        this.processedDataList = null;
    }
     
     toSimpleJSON()
     {
         let ret = {}
         ret.id = this.id;
         ret.location = this.location;
         ret.heading = this.heading;
         ret.pitch = this.pitch;
         ret.metadata = this.metadata;
         return ret;
     }

    getProcessedDataList(filterId){
        if (this.processedDataList === null)
        {
            return null;
        }
        else
        {
            return this.processedDataList[filterId];
        }
    }

    static fromObject(obj)
    {
        if (!GeoImage.isGeoImageCompliant(obj)) throw new Error('Input is not GeoImage compliant.');
        let newGeoImage = new GeoImage();
        for (let prop in obj) {
            if (newGeoImage.hasOwnProperty(prop)) {
                newGeoImage[prop] = obj[prop];
            }
        }
        return newGeoImage;
    }
    static isGeoImageCompliant(obj)
    {
        let exampleGeoImage = new GeoImage();
        let ret = true;
        //for (let prop in obj) {
        for (let prop in exampleGeoImage) {
            //if (!exampleGeoImage.hasOwnProperty(prop)) {
            if (!obj.hasOwnProperty(prop)) {
                //ret = false;
                return false
            }
        }
        //return ret;
        return true;
    }

}