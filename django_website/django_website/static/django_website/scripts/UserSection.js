class Region
{
    constructor(id, name, active)
    {
        active = typeof (active) === 'undefined' ? false : active;
        this._id = id;
        this._name = name;

        //Using setter to verify type consistency
        this.active = active;
    }

    toggleActive()
    {
        this.active = !this.active;
        return this.active;
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get active() { return this._active; }
    set active(newState)
    {
        if (typeof (newState) !== "boolean")
            throw Error(`newState parameter type should be boolean, but is: ${typeof (newState)}`);
        this._active = newState;
    }
}

class UserSection
{
    constructor(regionsDivId)
    {
        this.setTarget(regionsDivId);

        /* Events Region */
        /* Called when all the streets from all the regions are collapsed into .allstreets array */
        this.onstreetsconsolidated = null;
        this.onregionlistitemclick = null;


        /* Feature collections with Polygons representing regions of interest*/
        this._regions = {};

        /* A list, without duplicates, of all streets collected in the regions of interest */
        this._allstreets = {};
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

    createNewRegion(id, name, active)
    {
        //active default is false
        if (!(id in this._regions))
        {
            this._regions[id] = new Region(id, name, active);
            this.updateRegionsDiv();
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

    getRegions()
    {
        return this._regions;
    }

    getRegionById(regionId)
    {
        return this._regions[regionId];
    }

    get streets()
    {
        return this._allstreets;
    }

    getStreetByName(name)
    {
        return this._allstreets[name];
    }

    consolidateStreets()
    {
        /* Do job in background with workers if possible */
        if (window.Worker)
        {
            let mWorker = new Worker('/static/django_website/scripts/home/worker.js');
            mWorker.onmessage = function (e)
            {
                this._allstreets = e.data;
                if (this.onstreetsconsolidated)
                    this.onstreetsconsolidated();
            }.bind(this);
            mWorker.postMessage([this._regions, this._allstreets]);
        }
            /* if it's not possible to the it with workers then do it in foreground */
        else
        {
            /*
            *  Shallow copied to avoid change 'Streets' attribute from 'usersection.regions'.
            *  Works IN-PLACE when not using workers.
            */
            //collapseStreetsFromRegionsList@backgroundFunctions.js
            collapseStreetsFromRegionsList(regionsWithStreets, this._allstreets);
            if (this.onstreetsconsolidated)
                this.onstreetsconsolidated();
        }
    }
}