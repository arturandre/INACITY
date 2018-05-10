// Syntax: collapseStreetsFromRegionsList(regionsWithStreets: [region])

function collapseStreetsFromRegionsList(regionsWithStreets) {
    let ret = [];
    let artificialId = 0;
    for (regionIdx in regionsWithStreets)
    {
        for (streetIdx in regionsWithStreets[regionIdx].Streets)
        {
            street = regionsWithStreets[regionIdx].Streets[streetIdx];
            //If a street name appears in different regions they're collapsed at "ret"
            ret[street.name] = street;
        }
    }
    return ret;
}