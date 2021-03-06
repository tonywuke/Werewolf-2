/* eslint-disable */
var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: {
    'main-app': path.join(__dirname, 'src/client/main-app/index.js'),
    'login': path.join(__dirname, 'src/client/login/login.js'),
  },
  output: {
    path: path.join(__dirname, 'src/server/public/javascripts/'),
    publicPath: '/javascripts/',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['', '.js', '.vue']
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules')
  },
  module: {
    preLoaders: [
      {
        test: /\.vue$/,
        loader: 'eslint',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        loader: 'eslint',
        exclude: /node_modules/
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: { presets: ['es2015'] }
      },
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.styl$/,
        loader: 'style!css?sourceMap!stylus',
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url',
        query: {
          limit: 10000,
          name: '[name].[ext]?[hash:7]'
        }
      }
    ]
  },
  devtool: '#eval-source-map',
  eslint: {
    formatter: require('eslint-friendly-formatter')
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __DEVTOOLS__: false,  // <-------- ENABLE/DISABLE redux-devtools HERE
      __PORT__: 4567,
    }),
  ],
  externals: {
    'agora-rtc': 'AgoraRTC',
  },
}

