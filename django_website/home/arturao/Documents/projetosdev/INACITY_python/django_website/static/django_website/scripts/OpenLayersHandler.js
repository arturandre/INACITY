/**
* Responsible for handling several OpenLayers properties
* @module OpenLayersHandler
*/

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
        this.view = new ol.View({
            //projection: 'EPSG:4326',
            center: ol.proj.fromLonLat([ime_usp_location.lon, ime_usp_location.lat]),
            zoom: initial_zoom_level
        });
        this.map = new ol.Map({ interactions: ol.interaction.defaults({ mouseWheelZoom: false }) });

        this.map.setTarget(HTMLDIVtarget);
        //this.map.addLayer(this.sources[defaultTileProvider] || this.sources['osm_tiles']);
        this.map.addLayer(defaultTileProvider || OpenLayersHandler.TileProviders.OSM.provider);
        this.map.setView(this.view);
        this.map.renderSync();

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
        this.changeMapProvider(OpenLayersHandler.TileProviders.GOOGLE_HYBRID_TILES.provider);

        return instance;
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
}

