let instance = null;

class OpenLayersHandler
{
    constructor(HTMLDIVtarget)
    {
        if (!HTMLDIVtarget)
        {
            throw new Error('Map container div not informed! HTMLDIVtarget: ' + HTMLDIVtarget);
        }
        if (!instance) {
            instance = this;
        }
        else
        {
            if (instance.map.getTarget())
            {
                instance.map.setTarget(HTMLDIVtarget);
            }
            return instance;
        }

        var ime_usp_location = { lat: -23.5595116, lon: -46.731304 };
        var initial_zoom_level = 16;

        this.sources = {
            'osm_tiles': new ol.layer.Tile({ source: new ol.source.OSM() }),
            'google_roadmap_tiles': new ol.layer.Tile({ source: new ol.source.TileImage({ url: 'http://mt1.google.com/vt/lyrs=m@113&hl=en&&x={x}&y={y}&z={z}' }) })
        };
        this.view = new ol.View({
            center: ol.proj.fromLonLat([ime_usp_location.lon, ime_usp_location.lat]),
            zoom: initial_zoom_level
        });
        this.map = new ol.Map();
        this.map.setTarget(HTMLDIVtarget);
        this.map.addLayer(this.sources['osm_tiles']);
        this.map.setView(this.view);
        this.map.renderSync();

        return instance;
    }

    changeMapProvider(mapProviderId) {
        if (instance.map) {
            let currentView = instance.map.getView();
            //currentCenter = this.map.getCenter();
            //currentZoom = this.map.getZoom();
            instance.map.getLayers().clear();
            instance.map.addLayer(instance.sources[mapProviderId]);
            instance.map.setView(currentView);
            instance.map.renderSync();
        }
    }
}

//export default OpenLayersHandler;