//ref: https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a

/**
 * 
 * @param {Object} obj - The object whose properties will be fetch.
 * @param {Array<string>} path - An array defining the properties path
 */
function getPropPath(obj, path)
{
    if (!obj) return null;
    if (!path || path.length === 0) return obj;
    return path.reduce((prevVal, curVal) => (prevVal && prevVal[curVal]) ? prevVal[curVal] : null, obj);
}

// This snippet is provided in Django official documentation
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

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

/**
* Auxiliar function to display to the user eventual errors during ajax calls
* @param {string} locationName - Indication of where the error occured. (i.e. function's name)
* @param {string} textStatus - The type of error that occurred and an optional exception object, if one occurred. Possible values for the second argument (besides null) are "timeout", "error", "abort", and "parsererror".
* @param {string} errorThrown - When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
* @see {@link http://api.jquery.com/jquery.ajax/}
*/
function defaultAjaxErrorHandler(locationName, textStatus, errorThrown) {
    console.trace();
    alert(gettext('Error during server at') + `: ${locationName}. ` + gettext('Status') + `: ${textStatus}. ` + gettext('Error message') + ` : ${errorThrown} `);
    if (errorThrown)
        console.error(textStatus, errorThrown);
    else
        console.error(textStatus);
}


$(document).ready(function () {
    $('body').on('wheel', function (event) {
        if (event.shiftKey)
        {
            event.preventDefault();
        }
    });
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