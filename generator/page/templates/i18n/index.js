// LANG is a macro defined in webpack.config.js

var locale = require('./locale.' + LANG + '.js');
var __lang__ = '__lang__';

var globalIi18n = require('../../../i18n/locale.'+ LANG + '.js') || {};

function merge (a, b) {
  var ret = {};
  for (var i in a) {
    ret[i] = a[i];
  }
  for (i in b) {
    ret[i] = b[i];
  }

  return ret;
}

locale = merge(globalIi18n, locale);


module.exports = function (key, options) {
    if (!key) {
        return locale;
    }

    if (__lang__ === key) {
        return LANG;
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