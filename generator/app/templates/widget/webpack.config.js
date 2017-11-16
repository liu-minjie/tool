var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

var ROOT_PATH = __dirname;
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');

var i18nFiles = fs.readdirSync(path.resolve(ROOT_PATH, 'src/i18n'));

// remove index.js
i18nFiles.some(function(item, i) {
  if (item.indexOf('index') === 0) {
    i18nFiles.splice(i, 1);
    return true;
  }
});

var ret = i18nFiles.map(function(item) {
  var lang = item.split('.')[1];

  return {
    stats: {
      // warnings: false
    },
    entry: {
      'index.js': path.resolve(ROOT_PATH, 'src/index.js')
    },
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
        i18n: path.resolve(ROOT_PATH, 'src/i18n')
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
        },
        {
           test: /\.less$/,
           loader: 'style!css?sourceMap!less'
        },
        {
          test: /\.tpl$/,
          loader: "handlebars-loader"
        },
        {
          test: /\.html$/,
          loader: "handlebars-loader"
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({ LANG: "\'" +  lang + "\'"}),
      new webpack.optimize.UglifyJsPlugin({minimize: true})
    ]
  }
});

module.exports = ret;