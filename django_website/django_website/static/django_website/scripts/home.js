var oldmap = null;
var ime_usp_location = { lat: -23.5595116, lon: -46.731304 };
var initial_zoom_level = 16;

$(document).ready(function () {
    //load_map('googlemaps');
    load_map();
});

//function load_map(mapProviderId) {
function load_map() {
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ime_usp_location.lat, lng: ime_usp_location.lon },
        zoom: initial_zoom_level
    });
}

function changeMapProvider(mapProviderId) {
    var currentCenter = ime_usp_location;
    var currentZoom = 16;
    if (oldmap) {
        currentCenter = oldmap.getCenter();
        currentZoom = oldmap.getZoom();
    }
    var map = new mxn.Mapstraction('map', mapProviderId);
    map.setCenterAndZoom(currentCenter, currentZoom);
    oldmap = map;
}
