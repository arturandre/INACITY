// Syntax: collapseStreetsFromRegionsList(regionsWithStreets: [region], previousCollapsedList: region.allstreets = {})

function collapseStreetsFromRegionsList(regionsWithStreets, previousCollapsedList = {}) 
{
    let ret = previousCollapsedList;
    let artificialId = 0;
    for (regionIdx in regionsWithStreets) {
        for (streetIdx in regionsWithStreets[regionIdx].Streets) {
            street = regionsWithStreets[regionIdx].Streets[streetIdx];
            /* 
            *  Since each region is visited only once, and it can't have the same street name twice
            *  (streets are collapsed by name in a region at server side) then in case a street name is seen
            *  more than once it means that some of the selected regions are intersecting.
            *  In case of intersections the intersecting regions are registered.
            */
            if (!(street.name in ret)) {
                ret[street.name] = { 'street': street };
                ret[street.name]['regions'] = [regionIdx];
            }
            /*  
            *   There's no need to check if a region is already registered before pushing it.]
            *   It can't be pushed twice.
            */
            else
            {
                ret[street.name]['regions'].push(regionIdx);
            }
        }
    }
    return ret;
}