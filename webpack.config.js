var webpack = require('webpack');
var path = require('path');
require('es6-promise').polyfill();

var BUILD_DIR = path.resolve(__dirname, 'static/js');
var APP_DIR = path.resolve(__dirname, 'src/app');

var config = {
   entry: APP_DIR + '/index.jsx',
   output: {
      path: BUILD_DIR,
      filename: 'bundle.js'
   },
   module : {
      loaders : [
         {
            test : /\.jsx?/,
            include : APP_DIR,
            loader : 'babel'
         },
         { test: /\.css$/, loader: "style-loader!css-loader" }
      ]
   }
};

module.exports = config;

