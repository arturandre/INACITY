//var fs = require('fs');
//var path = require('path');

//var gsvPath = path.join(__dirname, '..', 'gsv_mykey.js');
//var gsvString = fs.readFileSync(gsvPath, 'utf8');

const promiseFinally = require('promise.prototype.finally');

// Add `finally()` to `Promise.prototype`
promiseFinally.shim();


var express = require('express');
var router = express.Router();

const google = require('./gsv_mykey.js').google;
const streetViewService = new google.maps.StreetViewService();
const maxRadius = 10;

/**
 * Auxiliar function to print errors caught.
 * @param err - {message: ..., stack: ...}
 * @param locationDescription - String to indicate where the exception was caught
 */
function defaultError(err, locationDescription)
{
	console.error(`Error caught at ${locationDescription}.`);
	console.error(err);
}

/**
 * Return a StreetViewPanoramaData object from 
 * lonLatCoordinate position if available
 * @param lonLatCoordinate - {lon: float, lat: float}
 */
function getPanoramaByLocation(lonLatCoordinate)
{
	return new Promise(function (resolve, reject) {
		let lon = lonLatCoordinate[0];
        let lat = lonLatCoordinate[1];
		let latlng = new google.maps.LatLng(lat, lon);
		streetViewService.getPanoramaByLocation(latlng, maxRadius, function (data, status)
		{
			//resolve({ data: data, status: status });
			if (status === "OK")
			{
				let parsedData = streetViewPanoramaDataParser(data);
				resolve(parsedData);
			}
			else
			{
				reject(status);
			}
			
		});
	});
}

/**
 * This function receives a geojson feature (not featurecollection) and for
 * each of its coordinates tries to find a panorama.
 * This function returns an array of StreetViewPanoramaData e.g.:
 * [{location: {...}, copyright: ...}]
 * @param feature A geojson feature object with one or more coordinates
 */
function getPanoramaForFeature(feature) {
    return new Promise(function (resolve) {

        let coordinates = feature.geometry.coordinates;
        console.log(coordinates);
        console.log("3");
        let ret = [];
		let numCalls = 1;
		if (typeof (coordinates[0]) !== "number") //Encapsulates both cases when it's zero or undefined
        {
			numCalls = coordinates.length;
			for (let i = 0; i < coordinates.length; i++) {
				let lonLatCoordinate = coordinates[i];
				getPanoramaForLonLatCoordinate(lonLatCoordinate);
			}
		}
		else
		{
			let lonLatCoordinate = coordinates;
			getPanoramaForLonLatCoordinate(lonLatCoordinate);
		}
		
		function getPanoramaForLonLatCoordinate(lonLatCoordinate)
		{
			let p = getPanoramaByLocation(lonLatCoordinate);
			p.then(
					function(streetViewPanoramaData)
					{
						ret.push(streetViewPanoramaData);
					},
					function(failedStatus)
					{
						console.warn(`Status for coordinates(lon: ${lonLatCoordinate[0]}, lat: ${lonLatCoordinate[1]}): ${failedStatus}`);
					}
				)
				.catch(
					function(err)
					{
						defaultError(err, "getPanoramaForFeature");
						throw new Error(err);
					}
				)
				.finally(
					function(){
					
						numCalls -= 1;
						if (numCalls == 0) {
						   resolve(ret);
						}
					}
				);
				
		}
    });
}
/**
 * This function creates a StreetViewPanoramaData from the location object
 * obtained through a call to the GSV's api to get panoramas ("data" field)
 * @param data is a complex object returned by the StreetViewService
 */
function streetViewPanoramaDataParser(data)
{
    //Location object example:
    //{latLng: _.K, shortDescription: "1576 R. do Lago", description: "1576 R. do Lago, São Paulo", pano: "-a6qbIWS7Op13QSWHAYzYA"}
	let gsvlocation = data.location;
	
    let StreetViewPanoramaData = 
	{
		location:
		{
			lat: gsvlocation.latLng.lat(),
			lon: gsvlocation.latLng.lng(),
			shortDescription: gsvlocation.shortDescription,
			description: gsvlocation.description,
			pano: gsvlocation.pano
		},
		copyright: data.copyright,
		links: data.links,
		tiles: data.tiles,
		time: data.time
	};
    return StreetViewPanoramaData;
}

/**
 * This function receives a collection (array) of "Data" objects obtained
 * through the StreetViewService API and returns a collection of
 * StreetViewPanoramaData.
 * @param gsvArrayOfData - [{data: ..., status: 'OK' }]
 */
function formatStreetViewPanoramaDataArray(gsvArrayOfData)
{
    let ret = [];
    for (let coordIdx = 0; coordIdx < gsvArrayOfData.length; coordIdx++) {
        let coord = gsvArrayOfData[coordIdx];
        if (coord.status === "OK") {
            ret.push(streetViewPanoramaDataParser(coord.data));
        }
        else {
            continue;
        }
    }
    return ret;
}

/* POST Api*/
router.post('/collectfcpanoramas', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    geojson = req.body;
    console.log("1");
    if (geojson.type === 'Feature') {
        console.log("2");
        getPanoramaForFeature(geojson).then(
			function (streetViewPanoramaDataArray) {
				
				console.log("6");
				let jsonString = JSON.stringify(streetViewPanoramaDataArray);
				res.send(jsonString);
			}, (err) => defaultError(err, "router post /collectfcpanoramas")
		);
    }
    else if (geojson.type === 'FeatureCollection') {
        let features = geojson.features;
        let ret = [];
        let nCalls = features.length;
        for (let fi = 0; fi < features.length; fi++) {
            let feature = features[fi];
            getPanoramaForFeature(feature)
			.then(
				function (streetViewPanoramaDataArray) 
				{
					ret.push(streetViewPanoramaDataArray);
					nCalls -= 1;
					let jsonString = JSON.stringify(ret);
					if (nCalls == 0) {
						res.send(jsonString);
					}
				}, (err) => defaultError(err, "router post /collectfcpanoramas")
			);
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

router.get('/gsvtest', (req, res) => res.send(google));
router.get('/gsvtest2', (req, res) => res.send(streetViewService));

router.get('/gsvtest3', function (req, res) {
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