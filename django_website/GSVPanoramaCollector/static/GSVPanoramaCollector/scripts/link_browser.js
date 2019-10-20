/**
 * The 'browser_session' variable 
 * comes from the template file (link_browser.html)
 * */

var gsvWSConsumer = null;

/**
     * This function is designed as a probe
     * for the GSVService. Note that the
     * panorama ID used (probePano) can (and should if necessary)
     * be replaced.
     */
async function probeGSVService()
{
    let probePano = "pr_ppN5mfHLh0PA1L10PXg";
    let probe = await GSVService.crawlNodes(probePano, 0);
    try
    {
        if (probe[probePano])
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    catch
    {
        return false;
    }
}

//$(document).ready(async function ()
window.onload = async function ()
{
    var socketStatus = document.getElementById("socketStatus");
    socketStatus.innerHTML = "Status: Disconnected";

    /** https://github.com/ierror/django-js-reverse/ */
    //gsvWSConsumer = new GSVCollectorWebSocket(Urls['relay_ws']('default_browser_session'));
    gsvWSConsumer = new GSVCollectorWebSocket('GSVPanoramaCollector', browser_session);
    gsvWSConsumer.onerrorhandler = (error) => { console.log('WebSocket Error: ' + error); };
    gsvWSConsumer.onmessagehandler = (message) =>
    {
        document.body.innerHTML += `<h1>Last message: ${message}</h1>`
    };
    gsvWSConsumer.onopenhandler = async (event) =>
    {
        socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.url;
        socketStatus.className = 'open';
        if (await probeGSVService())
        {
            gsvWSConsumer.sendMessage('Browser ready!', 'browser_ready');
        }
    };
    //}); ////$(document).ready(async function ()
};