/**
* Responsible for handling several OpenLayers properties
* @module OpenLayersHandler
*/

class DrawTool {
    constructor(DrawToolName, geoFunction) {
        if (DrawTool.isNameValid(DrawToolName)) {
            this.name = DrawToolName;
            this.geometryFunction = geoFunction;
        }
        else {
            throw Error(gettext("Invalid DrawToolName")+`: ${DrawToolName}`);
        }
    }
}

if (!DrawTool.init) {
    DrawTool.init = true;
    DrawTool.validNames =
        [
            gettext('Box'),
            gettext('Square'),
            gettext('Dodecagon')
        ];
    DrawTool.isNameValid = function (name) {
        return (DrawTool.validNames.indexOf(name) >= 0);
    }
}

let instance = null;

/**
* Responsible for handling several OpenLayers properties
* @param {string} HTMLDIVtarget - The DOMElement div's id that will be the container of map tiles, the map itself in other words
* @param {OpenLayersHandler.TileProviders} defaultTileProvider - The tile provider as registered at :js:attr:`TileProviders` class member.
* for OpenStreetMap's tiles, 'google_roadmap_tiles' for Google Maps tiles.
*/
class OpenLayersHandler {
    constructor(HTMLDIVtarget, defaultTileProvider) {
        if (!HTMLDIVtarget) {
            throw new Error('Map container div not informed! HTMLDIVtarget: ' + HTMLDIVtarget);
        }
        if (!instance) {
            instance = this;
        }
        else {
            if (instance.map.getTarget()) {
                instance.map.setTarget(HTMLDIVtarget);
            }
            return instance;
        }

        var ime_usp_location = { lat: -23.5595116, lon: -46.731304 };
        var initial_zoom_level = 16;

        //this.sources = {
        //    'osm_tiles': new ol.layer.Tile({ source: new ol.source.OSM() }),
        //    'google_roadmap_tiles': new ol.layer.Tile({ source: new ol.source.TileImage({ url: 'http://mt1.google.com/vt/lyrs=m@113&hl=en&&x={x}&y={y}&z={z}' }) })
        //};
        // this.view = new ol.View({
        //     //projection: 'EPSG:4326',
        //     center: ol.proj.fromLonLat([ime_usp_location.lon, ime_usp_location.lat]),
        //     zoom: initial_zoom_level
        // });
        this.view = new ol.View();
        this.map = new ol.Map({ interactions: ol.interaction.defaults({ mouseWheelZoom: false }) });

        this.map.setTarget(HTMLDIVtarget);
        //this.map.addLayer(this.sources[defaultTileProvider] || this.sources['osm_tiles']);
        //this.map.addLayer(defaultTileProvider || OpenLayersHandler.TileProviders.OSM.provider);
        this.map.setView(this.view);
        //this.map.renderSync();

        //create globaly a mouse wheel interaction and add it to the map 
        var mouseWheelInt = new ol.interaction.MouseWheelZoom();
        this.map.addInteraction(mouseWheelInt);

        this.map.on('wheel', function (evt) {
            let shiftKeyOnly = ol.events.condition.shiftKeyOnly(evt);
            mouseWheelInt.setActive(shiftKeyOnly);
            if (!shiftKeyOnly) {
                $('#mapOverlay').fadeTo(0, 0);
                $('#mapOverlay').show();
                $('#mapOverlay').fadeTo(600, 1, function () {
                    $('#mapOverlay').fadeTo(2000, 0, function () {
                        $('#mapOverlay').hide();
                    });
                });
            }
        });

        /**
        * Used as the global vector source of the [globalVectorLayer]{@link module:"home.js"~globalVectorLayer}
        * @type {ol.layer.Vector}
        * @see [ol.layer.Vector]{@link https://openlayers.org/en/latest/apidoc/ol.layer.Vector.html}
        */
        this.globalVectorSource = new ol.source.Vector({ wrapX: false });
        /**
        * Used as the global vector layer
        * @param {ol.layer.Vector}
        * @see [ol.layer.Vector]{@link https://openlayers.org/en/latest/apidoc/ol.layer.Vector.html}
        */
        this.globalVectorLayer = new ol.layer.Vector({
            source: this.globalVectorSource
        });

        this.globalVectorLayer.setMap(this.map);

        /** 
         * Default selections:
         * Tiles provider - Google maps road and satellite
        */
        //this.changeMapProvider(OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES.provider);

        this._drawInteraction = null;
        this._SelectedDrawTool = null;
        this._heatmapVector = null;


        this.onDrawEnd = null;

        return instance;
    }

    setDefaults(defaults) {
        if (defaults) {
            if (defaults.center) {
                this.view.setCenter(ol.proj.fromLonLat([defaults.center.lon, defaults.center.lat]));
            }
            if (defaults.zoom_level) {
                this.view.setZoom(defaults.zoom_level);
            }
            if (defaults.tileProvider)
            {
                this.SelectedMapProvider = defaults.tileProvider;
            }
            if (defaults.drawTool)
            {
                this.SelectedDrawTool = defaults.drawTool;
            }
        }
    }

    get SelectedDrawTool() { return this._SelectedDrawTool; }
    set SelectedDrawTool(drawTool) {

        if (!drawTool) {
            if (this._SelectedDrawTool) this.map.removeInteraction(this._drawInteraction);
            this._SelectedDrawTool = drawTool;
            return;
        }

        if (!DrawTool.isNameValid(drawTool.name)) {
            throw Error(gettext("Invalid DrawTool."));
        }

        if (drawTool && this._SelectedDrawTool) {
            this.map.removeInteraction(this._drawInteraction);
        }

        this._SelectedMapProvider = null;
        this._SelectedDrawTool = drawTool;

        this._drawInteraction = new ol.interaction.Draw({
            source: this.globalVectorSource,
            type: 'Circle',
            geometryFunction: this._SelectedDrawTool.geometryFunction,
        });

        this._drawInteraction.on('drawend', this.onDrawEnd, this);
        this.map.addInteraction(this._drawInteraction);
    }

    get SelectedMapProvider() { return this._SelectedMapProvider; }
    set SelectedMapProvider(tileProvider) {
        this._SelectedMapProvider = tileProvider;
        this.changeMapProvider(tileProvider.provider);
    }

    get heatmapVector() { return this._heatmapVector; }

    set heatmapVector(source)
    {

        this._heatmapVector = new ol.layer.Heatmap({
            source: new ol.source.Vector(
            {
            url: 'https://openlayers.org/en/latest/examples/data/kml/2012_Earthquakes_Mag5.kml',
            format: new ol.format.KML({
            extractStyles: false
            })
            }),
            blur: 10,
            radius: 10
            });

        OpenLayersHandler.notify('heatmapvectorchanged', this.heatmapVector); 
    }

    

    /**
     * Set the map tiles provider for displaying
     * @param {OpenLayersHandler.TileProviders} tileProvider - The tile provider as registered at :js:attr:`TileProviders` class member.
     */
    changeMapProvider(tileProvider) {
        if (instance.map) {
            let currentView = instance.map.getView();
            //currentCenter = this.map.getCenter();
            //currentZoom = this.map.getZoom();
            instance.map.getLayers().clear();
            instance.map.addLayer(tileProvider);
            instance.map.setView(currentView);
            instance.map.renderSync();
        }
    }
}

if (!OpenLayersHandler.init) {
    OpenLayersHandler.init = true;

    OpenLayersHandler.registerEventNames([
        'heatmapvectorchanged',
    ]);

    /**
     * Collection of registered tile providers from OpenLayers
     * @example 
     * //OpenStreetMaps tile provider
     * OpenLayersHandler.TileProviders.OSM
     * @example 
     * //Google road maps tile provider
     * OpenLayersHandler.TileProviders.GOOGLE_ROADMAP_TILES
     * @example 
     * //Google satelite with road maps tile provider
     * OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES
     * @see [OpenLayers Sources]{@link https://github.com/openlayers/openlayers/tree/v5.0.3/src/ol/source}
     */
    OpenLayersHandler.DrawTools =
        {
            Box: new DrawTool(gettext('Box'), ol.interaction.Draw.createBox()),
            Square: new DrawTool(gettext('Square'), ol.interaction.Draw.createRegularPolygon(4)),
            Dodecagon: new DrawTool(gettext('Dodecagon'), function (coordinates, geometry) {
                if (!geometry) {
                    geometry = new ol.geom.Polygon(null);
                }
                var center = coordinates[0];
                var last = coordinates[1];
                var dx = center[0] - last[0];
                var dy = center[1] - last[1];
                var radius = Math.sqrt(dx * dx + dy * dy);
                var rotation = Math.atan2(dy, dx);
                var newCoordinates = [];
                var numPoints = 12;
                for (var i = 0; i < numPoints; ++i) {
                    var angle = rotation + i * 2 * Math.PI / numPoints;
                    var offsetX = radius * Math.cos(angle);
                    var offsetY = radius * Math.sin(angle);
                    newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
                }
                newCoordinates.push(newCoordinates[0].slice());
                geometry.setCoordinates([newCoordinates]);
                return geometry;
            }),
        };

    /**
     * Collection of registered tile providers from OpenLayers
     * @example 
     * //OpenStreetMaps tile provider
     * OpenLayersHandler.TileProviders.OSM
     * @example 
     * //Google road maps tile provider
     * OpenLayersHandler.TileProviders.GOOGLE_ROADMAP_TILES
     * @example 
     * //Google satelite with road maps tile provider
     * OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES
     * @see [OpenLayers Sources]{@link https://github.com/openlayers/openlayers/tree/v5.0.3/src/ol/source}
     */
    OpenLayersHandler.TileProviders =
        {
            OSM: {
                name: 'OpenStreetMap',
                provider: new ol.layer.Tile({ source: new ol.source.OSM() })
            },
            GOOGLE_ROADMAP_TILES:
            {
                name: 'Google Maps Roads',
                provider: new ol.layer.Tile({ source: new ol.source.TileImage({ url: 'http://mt1.google.com/vt/lyrs=m@113&hl=en&&x={x}&y={y}&z={z}' }) })
            },
            GOOGLE_HYBRID_TILES:
            {
                name: 'Google Maps Hybrid',
                provider: new ol.layer.Tile({ source: new ol.source.TileImage({ url: 'http://mt1.google.com/vt/lyrs=y&hl=en&&x={x}&y={y}&z={z}' }) })
            }
        };
    OpenLayersHandler.Styles =
        {
            /**
             * Style used to mark a select(active) region
             * @const
             * @param {ol.style.Style}
             * @see [ol.style.Style]{@link https://openlayers.org/en/latest/apidoc/ol.style.Style.html}
             */
            selectedRegionStyle: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.1)' }),
                stroke: new ol.style.Stroke({
                    color: '#ff0000',
                    width: 1
                })
            }),

            /**
             * Auxiliar style to give transparency for OpenLayers' features
             * @const
             * @param {ol.style.Style}
             * @see [ol.style.Style]{@link https://openlayers.org/en/latest/apidoc/ol.style.Style.html}
             */
            transparentStyle: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(0,0,0,0.0)' }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0,0,0,0.0)',
                    width: 1
                })
            })
        };


}

