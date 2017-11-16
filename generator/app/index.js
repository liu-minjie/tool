var generators = require('yeoman-generator');
var commandExists = require('command-exists');
var path = require('path');
var extend = require('deep-extend');
var fs = require('fs');
var typeMap = {
  'web assets': 'web_assets',
  'web node': 'web_node',
  'widget config': 'widget_config',
  'widget': 'widget',
  'widget react': 'widget_react',
  'widget config react': 'widget_config_react'
}

module.exports = generators.Base.extend({
  initializing: function () {
    this.props = {};
  },
  prompting: function () {
    var done = this.async();
    var prompts = [{
        type: 'list',
        name: 'type',
        message: 'Project Type',
        choices: ['web assets', 'web node', 'widget config', 'widget', 'widget react', 'widget config react'],
        default: 'web assets'
    }]

    this.prompt(prompts, function(answer) {
        this.props.name = typeMap[answer.type];
        done();
    }.bind(this));
  },
  writing: function () {
    var t = this;
    var tmpPath = t.templatePath() + '/' + this.props.name;

    fs.readdir(tmpPath, function (err, files) {
      files.forEach( function (file) {
        if (file == '.git') {
          return;
        }
        if (file == 'build') {
          t.fs.copy(
              tmpPath + '/' + file,
              t.destinationPath(file), 
              {}
          );
        } else {
          t.fs.copyTpl(
              tmpPath + '/' + file,
              t.destinationPath(file), 
              {}
          );
        }
      });

      var pkg = t.fs.readJSON(t.destinationPath('package.json'), {});
      extend(pkg, {
        name: path.basename(process.cwd()),
        description: '',
        author: {
          name: process.env['USER'] || process.env['USERNAME'] || ''
        }
      });

      t.fs.writeJSON(t.destinationPath('package.json'), pkg);
    });
  },

  install: function () {
    //this.installDependencies({bower: false});
    var t = this;
    commandExists('cnpm', function(err, commandExists) {
      if (commandExists) {
        t.spawnCommand('cnpm', ['install'])
      } else {
        t.spawnCommand('npm', ['install'])
      }

    });
  }
});