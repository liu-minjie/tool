require('./home.less');

var i18n = require('i18n');

var component = require('../../components/sayHello');

component.sayHello('web developer');

console.log(i18n('bye') + '!');

console.log(require('./template.html')());


