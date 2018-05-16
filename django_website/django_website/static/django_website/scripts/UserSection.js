class UserSection
{
    constructor()
    {
        /*Events*/
        this.onstreetsconsolidated = null;

        this.regions = [];
        this.allstreets = [];
    }

    consolidateStreets() {
        //let auxConsolidatedList = {};
        //for (let sName in this.allstreets) {
        //    let street = this.allstreets[sName];
        //    auxConsolidatedList[sName] = { 'street': street.street, 'regions': street.regions };
        //}
        //Do job in background with workers if possible
        if (window.Worker) {
            let mWorker = new Worker('/static/django_website/scripts/home/worker.js');
            mWorker.onmessage = function (e) {
                //e.data = collapseStreetsFromRegionsList(regionsWithStreets) -> [only streets]
                //this.updateConsolidatedStreetsList(e.data);
                this.allstreets = e.data;
                if (this.onstreetsconsolidated)
                    this.onstreetsconsolidated();
            }.bind(this);
            mWorker.postMessage([this.regions, this.allstreets]);
        }
        else //if not then do in foreground
        {
            //Shallow copied to avoid change 'Streets' attribute from 'usersection.regions'
            //let newList = collapseStreetsFromRegionsList(regionsWithStreets, this.allstreets);
            //Works IN-PLACE in this case without workers
            collapseStreetsFromRegionsList(regionsWithStreets, this.allstreets);
            //this.updateConsolidatedStreetsList(newList);
            //UserSection.allstreets = collapseStreetsFromRegionsList(regionsWithStreets, UserSection.allstreets).slice();
            if (this.onstreetsconsolidated)
                this.onstreetsconsolidated();
        }
    }

    updateConsolidatedStreetsList(newList) {
        for (let street in newList) {
            if (street in this.allstreets) {
                this.allstreets[street].regions = newList[street].regions;
                if (this.allstreets[street].street.segments.length < newList[street].street.segments.length) {
                    this.allstreets[street].street.segments = newList[street].street.segments;
                }
            }
            else {
                this.allstreets[street] = newList[street];
            }
        }
    }

}