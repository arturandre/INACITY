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