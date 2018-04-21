//var fs = require('fs');
//var path = require('path');

//var gsvPath = path.join(__dirname, '..', 'gsv_mykey.js');
//var gsvString = fs.readFileSync(gsvPath, 'utf8');

const gsv = require('./gsv_mykey.js');

var express = require('express');
var router = express.Router();



/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/gsvtest', (req, res) => res.send(gsv))

module.exports = router;