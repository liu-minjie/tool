// LANG is a macro defined in webpack.config.js

var i18n = require('i18n');
var __lang__ = '__lang__';
var locale = require('./locale.' + i18n(__lang__) + '.js');

module.exports = function (key, options) {
    if (!key) {
        return locale;
    }

    if (__lang__ === key) {
        return i18n(__lang__);
    }

    options = options || {};

    return locale[key] 
        ? locale[key].replace(/\{\{(\w+)\}\}/g, function(s, $1) {
            return options[$1];
        })
        : (function() {
 
            console.warn('Key ' + key + ' is not found in locale');
            return '<?No Translation>';
        })();
};