class StreetSelect
{
    constructor(openLayersHandler)
    {
        if (!openLayersHandler)
        {
            throw new Error("openLayersHandler can't be undefined or null!");
        }
        this._openLayersHandler = openLayersHandler;
        this._openLayersHandler.map.addInteraction(StreetSelect.selectPointerMove);
        this._openLayersHandler.map.addInteraction(StreetSelect.selectSingleClick);

    }

}


if (!StreetSelect.init)
{
    StreetSelect.init = true;
    StreetSelect.selectPointerMove = new ol.interaction.Select
    ({
        condition: ol.events.condition.pointerMove
    });
    StreetSelect.selectSingleClick = new ol.interaction.Select
    ({
        condition: ol.events.condition.singleClick
    });
}
