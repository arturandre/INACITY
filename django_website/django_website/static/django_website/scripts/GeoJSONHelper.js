class GeoJSONHelper
{
    static loadOLFeatureFromGeoJSON(geoJSONFeature)
    {
        let olFeature = GeoJSONHelper.olGeoJson.readFeature(geoJSONFeature);
        let style = olFeature.getProperties().style;
        if (style)
        {
            olFeature.setStyle(OpenLayersHandler.Styles[style]);
        }
    }

    loadOLFeaturesFromGeoJSONArray(geoJSONFeatures)
    {

        let olFeatures = GeoJSONHelper.olGeoJson.readFeatures(geoJSONFeatures);
        for (const idx in olFeatures)
        {
            let olFeature = geoJsonFeatures[idx];
            let style = olFeature.getProperties().style;
            if (style)
            {
                olFeature.setStyle(OpenLayersHandler.Styles[style]);
            }
        }
    }

    /**
     * Auxiliar function to compare Longitude and Latitude coordinate arrays
     * @todo Transfer it to a more appropriate place
     * @param {float[]} lonLat1 - Array with 2 values
     * @param {float[]} lonLat2 - Array with 2 values
     * @returns {Boolean} - True if both coordinates have the same values
     */
    static compareCoordinates(lonLat1, lonLat2)
    {
        return ((lonLat1[0] === lonLat2[0]) && (lonLat1[1] === lonLat2[1]));
    }

    /**
     * Used for merging (in-place) the same feature present in different layers (e.g. A long street with different parts belonging to different layers)
     * @todo Transfer it to a more appropriate place
     * @param {Feature} feature1 - A MultiLineString Feature (e.g. a street)
     * @param {Feature} feature2 - A MultiLineString Feature (e.g. a street)
     */
    static mergeInPlaceMultilineStringFeatures(feature1, feature2)
    {
        let allLineStrings = [];
        for (let i = 0; i < feature1.geometry.coordinates.length; i++)
            allLineStrings.push(feature1.geometry.coordinates[i]);
        for (let i = 0; i < feature2.geometry.coordinates.length; i++)
            allLineStrings.push(feature2.geometry.coordinates[i]);
        let merged = true;
        while (merged)
        {
            merged = false;
            for (let i = allLineStrings.length - 1; i > 0; i--)
            {
                for (let j = i - 1; j >= 0; j--)
                {
                    //First check if the strings are equal
                    if (GeoJSONHelper.compareCoordinates(allLineStrings[i][0], allLineStrings[j][0])
                        &&
                        GeoJSONHelper.compareCoordinates(allLineStrings[i][allLineStrings[i].length - 1],
                            allLineStrings[j][allLineStrings[j].length - 1])) //heads-heads and tails-tails
                    {
                        merged = true;
                        break;
                    }
                    else if (GeoJSONHelper.compareCoordinates(allLineStrings[i][0], allLineStrings[j][0]))
                    { //heads-heads
                        //Remove repeated element from the second list
                        allLineStrings[j].splice(0, 1);
                        allLineStrings[j] = allLineStrings[i].reverse().concat(allLineStrings[j]);
                        merged = true;
                        break;
                    }
                    else if (GeoJSONHelper.compareCoordinates(allLineStrings[i][allLineStrings[i].length - 1],
                        allLineStrings[j][allLineStrings[j].length - 1]))
                    { //tails-tails
                        //Remove repeated element from the second list
                        allLineStrings[j].splice(allLineStrings[j].length - 1, 1);
                        allLineStrings[j] = allLineStrings[j].concat(allLineStrings[i].reverse());
                        merged = true;
                        break;
                    }
                    else if (GeoJSONHelper.compareCoordinates(allLineStrings[i][allLineStrings[i].length - 1], allLineStrings[j][0]))
                    { //tails-heads
                        //Remove repeated element from the second list
                        allLineStrings[j].splice(0, 1);
                        allLineStrings[j] = allLineStrings[i].concat(allLineStrings[j]);
                        merged = true;
                        break;
                    }
                    else if (GeoJSONHelper.compareCoordinates(allLineStrings[i][0], allLineStrings[j][allLineStrings[j].length - 1]))
                    { //heads-tails
                        //Remove repeated element from the second list
                        allLineStrings[j].splice(allLineStrings[j].length - 1, 1);
                        allLineStrings[j] = allLineStrings[j].concat(allLineStrings[i]);
                        merged = true;
                        break;
                    }
                }
                if (merged)
                {
                    //debugging only
                    //print("deleted: ", nodesSegList[i])
                    //print("merged: ", nodesSegList[j])
                    allLineStrings.splice(i, 1);
                    break;
                }
            }
            //if (!merged) {
            //    break;
            //}
        }
        feature1.geometry.coordinates = feature2.geometry.coordinates = allLineStrings;
    }

    static writeFeature(olFeature)
    {
        return JSON.parse(GeoJSONHelper.olGeoJson.writeFeature(olFeature));
    }

    static writeFeatures(olFeatures)
    {
        return JSON.parse(GeoJSONHelper.olGeoJson.writeFeatures(olFeatures)).features
    }

}

//Ref: https://stackoverflow.com/a/32647583/3562468
Object.defineProperty(GeoJSONHelper, 'olGeoJson', {
    value: new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' }),
    writable: false,
    enumerable: true,
    configurable: false
});