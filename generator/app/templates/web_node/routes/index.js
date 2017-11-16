var config = require('../config');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { 
        title: req.__('hi'), 
        assets: config.assets,
        lang: req.locale
    });
});

module.exports = router;
