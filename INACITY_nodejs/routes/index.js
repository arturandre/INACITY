//var fs = require('fs');
//var path = require('path');

//var gsvPath = path.join(__dirname, '..', 'gsv_mykey.js');
//var gsvString = fs.readFileSync(gsvPath, 'utf8');
var express = require('express');
var router = express.Router();



const google = require('./gsv_mykey.js').google;
const streetViewService = new google.maps.StreetViewService();
const maxRadius = 10;

function getPanoramaForFeature(feature) {
    return new Promise(function (resolve, reject) {

        let coordinates = feature.geometry.coordinates;
        console.log(coordinates);
        console.log("3");
        let ret = [];
        if (coordinates[0] > 0) //Encapsulates both cases when it's zero or undefined
        {
            let numCalls = coordinates.length;
            for (let i = 0; i < coordinates.length; i++) {
                let coordinate = coordinates[i];
                let lon = coordinate[0];
                let lat = coordinate[1];
                let latlng = new google.maps.LatLng(lat, lon);
                streetViewService.getPanoramaByLocation(latlng, maxRadius, function (data, status) {
                    ret.push({ data: data, status: status });
                    numCalls -= 1;
                    if (numCalls == 0) {
                        resolve(ret);
                    }
                });
            }
        }
        else {
            console.log("4");

            let lon = coordinates[0];
            let lat = coordinates[1];
            let latlng = new google.maps.LatLng(lat, lon);
            streetViewService.getPanoramaByLocation(latlng, maxRadius, function (data, status) {
                console.log("5");
                ret.push({ data: data, status: status });
                console.log("5.1");
                console.log(ret);
                resolve(ret);
            });
        }
    });
}

/* POST Api*/
router.post('/collectfcpanoramas', function (req, res) {
    geojson = req.body;
    console.log("1");
    if (geojson.type === 'Feature') {
        console.log("2");
        getPanoramaForFeature(geojson).then(function (r) {
            console.log("6");
            res.send(r);
        });
    }
    else if (geojson.type === 'FeatureCollection') {
        let features = geojson.features;
        let ret = [];
        let nCalls = features.length;
        for (let fi = 0; fi < features.length; fi++) {
            let feature = features[fi];
            getPanoramaForFeature(feature).then(function (r) {
                ret.push(r);
                nCalls -= 1;
                if (nCalls == 0) {
                    res.send(ret);
                }
            });
        }
    }
    else {
        res.status(400)
        res.send("Geojson type unaccepted. Acceptable types: 'Feature', 'FeatureCollection'.");
    }
    console.log(req.body);
});

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/gsvtest', (req, res) => res.send(gsv));

router.get('/gsvtest2', function (req, res) {
    let myLatlng = new google.maps.LatLng(-23.560239, -46.731261);
    streetViewService.getPanoramaByLocation(myLatlng, 50, function (data, status) {
        let ret = "data:\n" + data + "\n Status \n" + status;
        console.log(data);
        res.send(ret);
    });
    //res.send(gsv.google.maps);
});

router.get('/findgsvpano', function (req, res) {
    var sv = new gsv.maps.StreetViewService();
    res.send(sv);
});

module.exports = router;