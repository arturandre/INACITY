$(document).ready(function () {
});

function filterIt()
{
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/integrationtest/', true);
    //xhr.responseType = 'arraybuffer';
    xhr.responseType = 'blob';
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {//Call a function when the state changes.
        if (xhr.readyState == 4 && xhr.status == 200) {
            let blob = new Blob([this.response], { type: 'image/png' });
            console.log(blob, blob.type, this.response, typeof this.response);

            let image = document.getElementById('imgUrbanPicture');
            image.src = window.URL.createObjectURL(blob);
            //let uInt8Array = new Uint8Array(this.response);
            //let i = uInt8Array.length;
            //let binaryString = new Array(i);
            //while (i--) {
            //    binaryString[i] = String.fromCharCode(uInt8Array[i]);
            //}
            //let data = binaryString.join('');

            //let base64 = window.btoa(data);

            //document.getElementById("imgUrbanPicture").src = "data:image/png;base64," + base64;
        }
    }

    xhr.send(JSON.stringify({ 'location': { 'lat': -23.560271, 'lon': -46.731295 } }));

    return;
    $.ajax({
        url: "/integrationtest/",
        method: "POST",
        contentType: 'application/json',
        data: JSON.stringify({ 'location': { 'lat': -23.560271, 'lon': -46.731295 } }),
        dataType: 'json',
        success: function (data) {
            alert("Data: " + data + "\nStatus: " + status);
        },
        error: function (jqXHR, exception) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'Not connect.\n Verify Network.';
            } else if (jqXHR.status == 404) {
                msg = 'Requested page not found. [404]';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            } else if (exception === 'parsererror') {
                msg = 'Requested JSON parse failed.';
            } else if (exception === 'timeout') {
                msg = 'Time out error.';
            } else if (exception === 'abort') {
                msg = 'Ajax request aborted.';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
        }
    });
        
}
