var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var ROOT_PATH = __dirname;
var BUILD_PATH = path.resolve(__dirname, 'build');
const prod = process.env.NODE_ENV === "production";


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
    resolve: {
      alias: {
        i18n: path.resolve(ROOT_PATH, 'src/i18n'),
        // 'react-dnd': 'react-dnd/dist/ReactDnD',
      },
      extensions: ['', '.js', '.jsx']
    },
    externals: {
      react: 'window.React',
      'react-dom': 'window.ReactDOM',
    },
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          loader: "babel",
          include: [
            path.join(__dirname, "src"),
          ]
        },
        {
          test: /\.css$/,
          loaders: ['style', 'css']
        },
        {
          test: /\.less$/,
          loader: 'style!css?sourceMap!less'
        },
      ]
    },
    plugins: [
      new webpack.DefinePlugin({ LANG: "\'" +  lang + "\'"}),
      new webpack.optimize.UglifyJsPlugin({
        minimize: prod, 
        compress: {
          drop_debugger: prod, 
          drop_console: prod
        } 
      })
    ]
  }
});

module.exports = ret;
