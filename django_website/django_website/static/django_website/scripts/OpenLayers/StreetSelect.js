class StreetSelect extends Subject
{
    constructor(openLayersHandler)
    {
        super();

        if (!openLayersHandler)
        {
            throw new Error("openLayersHandler can't be undefined or null!");
        }
        this._openLayersHandler = openLayersHandler;
        // this._openLayersHandler.map.addInteraction(StreetSelect.selectSingleClick);
        //this._openLayersHandler.map.addInteraction(StreetSelect.selectPointerMove);

        this._lastHoveredFeature = null;
        this._lastSelectedFeature = null;

        //StreetSelect.selectPointerMove.on('select', this._hoverIgnoreRegion.bind(this));
        // StreetSelect.selectSingleClick.on('select', this._singleClickSelect.bind(this));

        //  this._openLayersHandler.map.on('singleclick', this.selectStreetOnSingleClick.bind(this));
        this._openLayersHandler.map.on('singleclick', this._singleClickSelect.bind(this));
        this._openLayersHandler.map.on('pointermove', this._hoverIgnoreRegion.bind(this));
    }

    clear()
    {
        this._selectFeature(null);
    }

    get lastSelectedFeature() { return this._lastSelectedFeature; }

    _selectFeature(OLFeature)
    {
        if (this._lastSelectedFeature)
        {
            this._lastSelectedFeature.setStyle(null);
            if (this._lastSelectedFeature === OLFeature)
            {
                this._lastSelectedFeature = null;
                StreetSelect.notify("selectedfeaturechanged", null);
                return;
            }
        }
        

        this._lastSelectedFeature = OLFeature;
        if (!OLFeature) return;
        this._lastSelectedFeature.setStyle(StreetSelect.selectedStyle);
    }

    _singleClickSelect(e)
    {
        let hit = false;
        this._openLayersHandler.map.forEachFeatureAtPixel(e.pixel, (feature, layer) =>
        {

            if (feature.getProperties()['type'] !== 'region')
            {
                hit = true;
                if (feature === this._lastHoveredFeature)
                {
                    console.log(feature.getId());
                    this._selectFeature(this._lastHoveredFeature);
                    StreetSelect.notify("selectedfeaturechanged", this._lastSelectedFeature);
                    return true;
                }
            }
        },
            {
                hitTolerance: 10
            });
        if (!hit)
        {
            this._selectFeature(null);
        }
    }

    _hoverIgnoreRegion(e)
    {
        let features = e.target.getFeaturesAtPixel(e.pixel);
        if (features)
        {
            if (
                (features[0].getProperties()['type'] !== 'region')
            && features[0].getProperties().name)
            {
                if (this._lastHoveredFeature)
                {
                    if (this._lastHoveredFeature === features[0]
                    || this._lastSelectedFeature === features[0])
                    {
                        return;
                    }
                    else
                    {
                        if (this._lastHoveredFeature !== this._lastSelectedFeature)
                        {
                            this._lastHoveredFeature.setStyle(null);
                            this._lastHoveredFeature.changed();
                        }
                    }

                }
                this._lastHoveredFeature = features[0];
                this._lastHoveredFeature.setStyle(StreetSelect.hoveredStyle);
                this._lastHoveredFeature.changed();

            }
        }
    }
}


if (!StreetSelect.init)
{
    StreetSelect.init = true;

    StreetSelect.registerEventNames([
        "selectedfeaturechanged"
    ]);

    StreetSelect.hoveredStyle = [
        //White outline
        new ol.style.Style(
            {
                stroke: new ol.style.Stroke(
                    {
                        color: 'rgba(255, 255, 255, 1)',
                        width: 7,
                    })
            }),
        //Inner blue line
        new ol.style.Style(
            {
                stroke: new ol.style.Stroke(
                    {
                        color: 'rgba(0, 153, 255, 1)',
                        width: 5
                    })
            })
    ];

    StreetSelect.selectedStyle = [
        //White outline
        new ol.style.Style(
            {
                stroke: new ol.style.Stroke(
                    {
                        color: 'rgba(255, 255, 255, 1)',
                        width: 7,
                    })
            }),
        //Inner orange line
        new ol.style.Style(
            {
                stroke: new ol.style.Stroke(
                    {
                        color: 'rgba(255, 127, 14, 1)',
                        width: 5
                    })
            })
    ];





}
