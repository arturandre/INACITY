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