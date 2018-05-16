﻿// Syntax: collapseStreetsFromRegionsList(regionsWithStreets: [region], previousCollapsedList: region.allstreets | {})

function collapseStreetsFromRegionsList(regionsWithStreets, previousCollapsedList) 
{
    
    let artificialId = 0;
    for (regionIdx in regionsWithStreets) {
        for (streetIdx in regionsWithStreets[regionIdx].Streets['features']) {
            street = regionsWithStreets[regionIdx].Streets['features'][streetIdx];
            /* 
            *  Since each region is visited only once, and it can't have the same street name twice
            *  (streets are collapsed by name in a region at server side) then in case a street name is seen
            *  more than once it means that some of the selected regions are intersecting.
            *  In case of intersections the intersecting regions are registered.
            */
            if (!(street['properties'].name in previousCollapsedList)) {
                previousCollapsedList[street['properties'].name] = { 'street': street };
                previousCollapsedList[street['properties'].name]['regions'] = [regionIdx];
            }
                /*  
                *   There's no need to check if a region is already registered before pushing it.]
                *   It can't be pushed twice.
                */
            else
            {
                if (previousCollapsedList[street['properties'].name]['regions'].indexOf(regionIdx) < 0)
                    previousCollapsedList[street['properties'].name]['regions'].push(regionIdx);
                if (previousCollapsedList[street['properties'].name].street.geometry.coordinates.length < street.geometry.coordinates.length) {
                    previousCollapsedList[street['properties'].name].street = street;
                }
            }
        }
    }
    return previousCollapsedList;
}