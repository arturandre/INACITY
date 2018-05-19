class Layer
{
    constructor(id)
    {
        this._id = id;
        this._featureCollection = null;

        this.onfeaturecollectionchange = null;
    }

    get id() { return this._id; }
    get featureCollection() { return this._featureCollection; }
    set featureCollection(newFeatureCollection)
    {
        let triggerFeatureCollectionChange = false;
        if (this._featureCollection !== newFeatureCollection)
        {
            triggerFeatureCollectionChange = true;
        }
        /* Keep state */
        let drawedState = this._featureCollection ? this._featureCollection.drawed : undefined;

        this._featureCollection = newFeatureCollection;

        /* Restore state */
        this._featureCollection.drawed = drawedState;


        if (triggerFeatureCollectionChange)
        {
            if (this.onfeaturecollectionchange)
            {
                this.onfeaturecollectionchange(this);
            }
        }
    }
}

class Region
{
    constructor(id, name, active)
    {
        active = typeof (active) === 'undefined' ? false : active;
        this._id = id;
        this._name = name;

        /* Events */
        /*
        *  Syntax: onactivechange = function (region) {}
        *  Triggered when "active" property's value changes.
        */
        this.onactivechange = null;
        /* 
        *  Syntax: onaddlayer = function (layer) {} 
        *  Triggered when a new layer is created in this region
        */
        this.onaddlayer = null;

        /* 
        *  Each layer is named after a MapMiner and a Feature
        *  concatenated by an underscore.
        *  Each layer contains a collection of regions 
        *  named 'regions' and a listOfFeatures
        *  with all the features collapsed into a single list.
        */
        this._layers = {};

        //Using setter to verify type consistency
        this.active = active;
    }

    createLayer(id)
    {
        if (!(id in this._layers))
        {
            let newLayer = new Layer(id);
            this._layers[id] = newLayer;
            if (this.onaddlayer) { this.onaddlayer(newLayer); }
            return newLayer;
        }
        else
        {
            throw Error(`id: '${id}' already present in layers list!`);
        }
    }

    toggleActive()
    {
        this.active = !this.active;
        return this.active;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get layers() { return this._layers; }
    getLayerById(id) { return this._layers[id]; }

    get active() { return this._active; }
    set active(newState)
    {
        if (typeof (newState) !== "boolean")
            throw Error(`newState parameter type should be boolean, but is: ${typeof (newState)}`);
        let triggerActiveChange = this._active !== newState;
        this._active = newState;
        if (this.onactivechange)
        {
            this.onactivechange(this);
        }
    }
}

class UserSection
{
    constructor(regionsDivId)
    {
        this.setTarget(regionsDivId);

        /* Events Region */

        /*
        *  Syntax: onregionlistitemclick = function (region)
        *  Triggered by a mouse click event in the user interface
        */
        this.onregionlistitemclick = null;

        /* 
        *  Feature collections with Polygons 
        *  representing regions of interest
        */
        this._regions = {};

        /* 
        *  An index of all features from all regions grouped by layerId
        */
        this._featuresByLayerIndex = {};
    }

    get featuresByLayerIndex() { return this._featuresByLayerIndex; }

    isFeatureActive(layerId, featureId)
    {
        for (let regionIdx in this.featuresByLayerIndex[layerId][featureId].regions)
        {
            let regionId = this.featuresByLayerIndex[layerId][featureId].regions[regionIdx];
            if (this.regions[regionId].active) return true;
        }
        return false;
    }

    setTarget(regionsDivId)
    {
        this._target = $(`#${regionsDivId}`);
        this._target.addClass('list-group');
    }

    updateRegionsDiv()
    {
        this._target.empty();

        for (let regionIdx in this._regions)
        {
            let region = this._regions[regionIdx];

            let item = $(document.createElement('a'));
            item.addClass('list-group-item');
            item.addClass('list-group-item-action');
            item.addClass('active-list-item');
            item.append(region.name);
            item.on("click", region, this._regionListItemClickHandler.bind(this));
            if (region.active)
                item.addClass('active');
            else
                regionVectorSource.getFeatureById(region.id).setStyle(null);
            this._target.append(item);
        }

    }

    _regionListItemClickHandler(event)
    {
        let element = $(event.target);
        element.toggleClass("active");
        let region = event.data;
        region.toggleActive();
        if (this.onregionlistitemclick)
        {
            this.onregionlistitemclick(region);
        }

    }

    createRegion(id, name, active)
    {
        //active default is false
        if (!(id in this._regions))
        {
            let newRegion = new Region(id, name, active);
            this._regions[id] = newRegion;
            newRegion.onaddlayer = function (layer)
            {
                layer.onfeaturecollectionchange = function (layer)
                {
                    this.updateFeatureIndex(layer.id);
                }.bind(this); /* UserSection */
            }.bind(this); /* UserSection */
            this.updateRegionsDiv();
            return newRegion;
        }
        else
        {
            throw Error(`id: '${id}' already present in regions list!`);
        }
    }

    removeRegion(id)
    {
        if ((id in this._regions))
        {
            return delete this._regions[id];
        }
        else
        {
            throw Error(`id: '${id}' not found in regions list!`);
        }
    }

    get regions() { return this._regions; }

    getRegionById(regionId) { return this._regions[regionId]; }

    updateFeatureIndex(layerId)
    {
        for (let regionIdx in this.regions)
        {
            let region = this.regions[regionIdx];
            let layer = region.layers[layerId];
            if (!layer) continue;
            let flIndex = this._featuresByLayerIndex[layerId];
            if (!flIndex) flIndex = this._featuresByLayerIndex[layerId] = {};
            for (let featureIdx in layer.featureCollection.features)
            {
                let feature = layer.featureCollection.features[featureIdx];
                if (!flIndex[feature.id]) flIndex[feature.id] =
                    {
                        'feature': feature,
                        'regions': [regionIdx]
                    };
                else
                {
                    //Update the feature in flIndex only if the new feature has more coordinates
                    if (flIndex[feature.id].feature.geometry.coordinates.length < feature.geometry.coordinates.length)
                    {
                        flIndex[feature.id].feature = feature;
                    }
                    //If this feature appears in different regions then keep track of the regions where it appears
                    if (flIndex[feature.id].regions.indexOf(regionIdx) === -1)
                    {
                        flIndex[feature.id].regions.push(regionIdx);
                    }
                }
            }


        }

    }
}