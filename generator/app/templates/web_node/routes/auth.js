var config = require('../config');
var log4js = require('log4js');
log4js.configure(config.logSettings);
var express = require('express');
var router = express.Router();
var userRpc = require('../service/user');

function checkLogin (token, req) {
    return new Promise(function (resolve, reject) {
        if (token) {
            userRpc.isLoggedIn(token, function (error, result) {
                if (result && result.success && result.isLoggedIn) {
                    resolve(result.user);
                } else {
                    reject(req.__('tip.user.not.login'));
                }
            });
        } else {
            reject(req.__('tip.user.not.login'));
        }
    });
}

module.exports = function (req, res, next) {
    checkLogin(req.cookies.token, req).then( function (user) {
        req.user = user;
        next();
    }, function () {
        var callbackUrl = `http://${config.host}/${config.projectName}${req.url}`;
        //var callbackUrl = `http://project-center.com:5300/`;
        var ssoUrl = `http://${config.host}/${config.projectName}/sso`;
        //var ssoUrl = `http://project-center.com:5300/sso`;
        var url = `http://${config.host}${config.userCenterPath}login?callbackUrl=${encodeURI(callbackUrl)}&ssoUrl=${encodeURI(ssoUrl)}`;
        res.redirect(url);
    }).catch( function (error) {
        console.log(error);
        logger.error(error);
        next(error);
    }); 
};