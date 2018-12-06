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
        this.metadata = null;
        this.processedDataList = null;
    }
    static fromObject(obj)
    {
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
        for (let prop in obj) {
            if (!exampleGeoImage.hasOwnProperty(prop)) {
                ret = false;
            }
        }
        return ret;
    }

}