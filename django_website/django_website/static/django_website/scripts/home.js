var openLayersHandler = null;

$(document).ready(function () {
    openLayersHandler = new OpenLayersHandler('map', 'osm_tiles');
    $('#btnOSMMapsTiles').addClass('disabled');
});

function changeMapProviderClick(mapProviderId, event)
{
    if (!event.srcElement && !event.id) return;
    let elem_id = event.srcElement || event.id;
    let element = $('#' + elem_id);
    if (element.hasClass('disabled')) return;
    element.siblings().each(function (it, val) {
        $('#' + val.id).removeClass('disabled');
    });
    element.addClass('disabled');
    openLayersHandler.changeMapProvider(mapProviderId);
}