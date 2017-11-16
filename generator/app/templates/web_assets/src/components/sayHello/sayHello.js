var i18n = require('./i18n');

var Mod = {
    sayHello: function(name) {
        console.log(i18n('hi') + ',' + name);
    }
}


console.log(require('./template.html')());
module.exports = Mod;