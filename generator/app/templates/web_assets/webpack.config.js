var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');
var ROOT_PATH = path.resolve(__dirname);
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');
var ENTRIES = {};






var pages = fs.readdirSync(path.resolve(ROOT_PATH, 'src/pages'));
fs.readdirSync(ROOT_PATH).forEach( function (html) {
  if (/\.html$/.test(html)) {
    ENTRIES[html] = [path.resolve(ROOT_PATH, html)];
  }
});

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


var i18nMap = {};
pages.forEach( function (page) {
  var i18nFiles = fs.readdirSync(path.resolve(ROOT_PATH, 'src/pages/' + page + '/i18n'));
  i18nFiles.forEach( function (item, i) {
    if (item.indexOf('index') == 0) {
      return;
    }
    var lang = item.match(/locale\.([a-z-]+)\.js/)[1];
    i18nMap[lang] = i18nMap[lang] || [];
    i18nMap[lang].push(page);
  });
});

var ret = [];
for (var lang in i18nMap) {
  i18nMap[lang].forEach( function (page) {
      var JSENTRIES = {};
      JSENTRIES[page + '.js'] = [path.resolve(ROOT_PATH, 'src/pages/' + page + '/' + page +'.js')];
      ret.push({
        stats: {
          // warnings: false
        },
        entry: merge(JSENTRIES, ENTRIES),
        output: {
          path: BUILD_PATH + '/' + lang,
          filename: "[name]"
        },
        devServer: {
          contentBase: "./src"
        },
        devtool: 'source-map',
        resolve: {
          alias: {
            i18n: path.resolve(ROOT_PATH, 'src/pages/' + page + '/i18n')
          } 
        },
        module: {
          loaders: [
            {
              test: /\.(jpe?g|png|gif|svg)$/i,
              loader: 'url-loader' 
            },
            {
              test: /\.css$/,
              loaders: ['style', 'css']
              // include: APP_PATH
            },
            {
               test: /\.less$/,
               loader: 'style!css?sourceMap!less'
               //include: absSourcePath
            },
            {
              test: /\.html$/,
              loader: "handlebars-loader?helperDirs[]=" + __dirname + "/helpers" 
              // include: APP_PATH
            },{
              test: /\.json$/,
              loader: 'json'
              //include: APP_PATH
            }
          ]
        },
        plugins: [
          new webpack.DefinePlugin({
              LANG: "\'" +  lang + "\'"
          })
        ]
      })
  });
}


ret[0].plugins.push(new BrowserSyncPlugin({
  host: '127.0.0.1',
  port: 8001,
  server: { 
    baseDir: ['.'],
    files: ['./*.html', 'src/pages/**/*.js', 'src/pages/**/*.less', 'src/components/**/*.js', 'src/components/**/*.less'] 
  }
}));

module.exports = ret

