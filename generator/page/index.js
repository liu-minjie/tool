var generators = require('yeoman-generator');
var path = require('path');
var extend = require('deep-extend');
var fs = require('fs');

function toCamelCase(str) {
  return str
      .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
      .replace(/\s/g, '')
      .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}

module.exports = generators.Base.extend({
  initializing: function () {
    this.props = {};
  },
  prompting: function () {
    var done = this.async();
    var prompts = [{
        type: 'input',
        name: 'name',
        message: 'Page Name'
    }]

    this.prompt(prompts, function(answer) {
        this.props.name = toCamelCase(answer.name);
        done();
    }.bind(this));
  },
  writing: function () {
    var t = this;
    var tmpPath = t.templatePath();
    var destPath = t.destinationPath();
    var tmp = [{
      src: tmpPath + '/index.html',
      dist: destPath + '/' + t.props.name + '.html'
    }, {
      src: tmpPath + '/index.js',
      dist: destPath + '/src/pages/' + t.props.name + '/index.js'
    }, {
      src: tmpPath + '/page.js',
      dist: destPath + '/src/pages/' + t.props.name + '/' + t.props.name + '.js'
    }, {
      src: tmpPath + '/page.less',
      dist: destPath + '/src/pages/' + t.props.name + '/' + t.props.name + '.less'
    }];

    tmp.forEach( function (item) {
      t.template(item.src, item.dist);
    });
    t.fs.copy(
        tmpPath + '/i18n',
        t.destinationPath(destPath + '/src/pages/' + t.props.name + '/i18n'), 
        {}
    );
  },

  install: function () {
    //this.installDependencies({bower: false});
  }
});