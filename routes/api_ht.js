var express = require('express');
var router = express.Router();

var models = require('../models');

router.get('/', function(req,res,next) {
	var msg = {"group": "a_vot"};
	res.status(200);
	return res.send(msg);
});

module.exports = router;