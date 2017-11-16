var i18n = require('./i18n');
module.exports = function(key, def) {
    return i18n(key) || def;
};