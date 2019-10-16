/**
 * The 'browser_session' variable 
 * comes from the template file (link_browser.html)
 * */

var gsvWSConsumer = null;

//$(document).ready(async function ()
window.onload = async function ()
{
    var socketStatus = document.getElementById("socketStatus");
    socketStatus.innerHTML = "Status: Disconnected";

    /** https://github.com/ierror/django-js-reverse/ */
    //gsvWSConsumer = new GSVCollectorWebSocket(Urls['relay_ws']('default_browser_session'));
    gsvWSConsumer = new GSVCollectorWebSocket('GSVPanoramaCollector',browser_session);
    gsvWSConsumer.onerrorhandler = (error) => { console.log('WebSocket Error: ' + error); };
    gsvWSConsumer.onmessagehandler = (message) =>
    {
        document.body.innerHTML += `<h1>Last message: ${message}</h1>`
    };
    gsvWSConsumer.onopenhandler = (event) =>
    {
        socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.url;
        socketStatus.className = 'open';
    };
//}); ////$(document).ready(async function ()
};