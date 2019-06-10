/**
 * Responsible for displaying GeoImages from features
 * @module GeoImage
 */

/**
 * Responsible for displaying GeoImages
 * @param {string} id - The id of the image element (from DOM) that will be used to display the collected GeoImages.
 * @param {Location} location - Location of the GeoImage
 * @param {string} location.description - Decription about this location (i.e. address)
 * @param {float} location.lat - Latitude in the projection adopted (i.e. )
 * @param {float} location.lon - Decription about this location (i.e. address)
 * @param {string} location.lon - Decription about this location (i.e. address)
 * 
 * @param {Object} [options] - Optional settings
 * @param {int} [options.autoPlayTimeInterval=2000] - Interval for autoplay (default 2 seconds)
 */class GeoImage
{
    constructor() {
        this.id = null;
        this.location = null;
        this.heading = null;
        this.pitch = null;
        this.metadata = null;
        this.data = null;
        this.dataType = null;
        this.metadata = null;
        this.processedDataList = null;
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