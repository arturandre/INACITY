

function loadScript(url, callback) {
    /*////////////// SAMPLE OS USE ///////////
    //Use this in any javascript environment (Rhino)
    loadScript("http://your.cdn.com/second.js", function(){
        //initialization code
    });
    
    */

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState) {  //IE
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" ||
                    script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function () {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

$(document).ready(function () { 
    $.each($("#divNavBar").children(), function (i, v) {
        let urlpath = v.href.replace(/^.*\/\/[^\/]+/, '');
        if (urlpath === window.location.pathname) {
            $(v).addClass("active");
            $(v).append(' <span class="sr-only">(current)</span>');
        }
        else {
            $(v).removeClass("active");
        }
    });
});