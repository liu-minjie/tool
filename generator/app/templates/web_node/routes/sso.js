var express = require('express');
var router = express.Router();
var userRpc = require('../service/user');
var log4js = require('log4js');
var config = require('../config');
log4js.configure(config.logSettings);
var logger = log4js.getLogger('project');


router.get('/', function (req, res, next) {
    var token = req.query.token;
    var username = req.query.username;

    if (token && username) {
        userRpc.isLoggedIn(token, function (error, result) {
            if (error) {
                logger.error(error);
                res.jsonp({
                    success: false,
                    code: 2008,
                    message: req.__('tip.user.login.fail')
                });
                return;
            }
            if (result.success && result.isLoggedIn) {
                res.cookie('token', token, {maxAge: config.maxAge});
                res.cookie('username', username, {maxAge: config.maxAge});
                res.jsonp({
                    success: true
                });
            } else {
                res.jsonp({
                    success: false,
                    code: 1002,
                    message: req.__('tip.user.not.login')
                });
            }
        });
    } else {
        res.jsonp({
            success: false,
            code: 1000,
            message: req.__('tip.invalid.argument')
        })
    }
});

module.exports = router;