/* eslint-disable no-undef */
const Encore                      = require('@symfony/webpack-encore');
const GoogleFontsPlugin           = require('@beyonk/google-fonts-webpack-plugin');
const TerserPlugin                = require('terser-webpack-plugin');
const ImageminWebpWebpackPlugin   = require("imagemin-webp-webpack-plugin");
const ServiceWorkerWebbackPlugin  = require("serviceworker-webpack-plugin");
const WorkboxPlugin               = require('workbox-webpack-plugin');
const OfflinePlugin               = require('offline-plugin');
const FileManagerPlugin           = require('filemanager-webpack-plugin');

// define project to build
let _project = {
	type: 'static',
	template: 'slimSlider'
};

// require config file
let _config = require('./webpack/config');
let plugins = require('./webpack/plugins');

// Manually configure the runtime environment if not already configured yet by the "encore" command.
// It's useful when you use tools that rely on webpack.config.js file.
if (!Encore.isRuntimeEnvironmentConfigured()) {
  Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    // Directory where compiled assets will be stored.
    .setOutputPath(_config[_project.type].webpack.paths.output)

    // Public path used by the web server to access the output path.
    .setPublicPath(_config[_project.type].webpack.paths.public)

    .setManifestKeyPrefix(_config[_project.type].webpack.paths.manifest)

    // add hash to generated files
    .configureFilenames({
      js: _config[_project.type].paths.public.javascripts + "[name].js",
      css: _config[_project.type].paths.public.stylesheets + "[name].css"
    })

    .configureImageRule({
      filename: _config[_project.type].paths.public.images + "[name][ext]"
    })

    .configureFontRule({
      filename: _config[_project.type].paths.public.fonts + "[name][ext]"
    })

    .copyFiles(_config[_project.type].copyFiles)

    // Main entry for JS required globally. File includes a reference to assets/css/app.scss for CSS required globally.
    .addEntry("main", _config[_project.type].paths.assets + "/JavaScript/slimSlider")

    // Splits entries into chunks to avoid code duplication (e.g. two page-tied JS files both importing jQuery).
    //.splitEntryChunks()

    // Allows sass/scss files to be processed.
    .enableSassLoader()

    // enable source maps during development
    .enableSourceMaps(!Encore.isProduction())

    // empty the outputPath dir before each build
    .cleanupOutputBeforeBuild()

    // Shows OS notifications when builds finish/fail.
    //.enableBuildNotifications()

    .disableSingleRuntimeChunk()

    .configureManifestPlugin(options => {
      options.fileName = 'webpack-manifest.json';
    })

    // enable postcss loader
    .enablePostCssLoader((options) => {
      options.postcssOptions = {
        options: {
          sourceMap: "inline",
        },
        plugins: {
          // include whatever plugins you want
          // but make sure you install these via yarn or npm!

          // add browserslist config to package.json (see below)
          autoprefixer: {},

          // inline-svg
          "@andreyvolokitin/postcss-inline-svg": {},

          // svgo
          "postcss-svgo": {},

          // preset-env
          "postcss-preset-env": {},

          // pxtorem
          "postcss-pxtorem": {
            rootValue: 16,
            propList: ["*"],
          },
        },
      };
    })

    /*.addPlugin(new GoogleFontsPlugin({
      formats: ['woff2'],
      fonts: [
          { family: 'Roboto', variants: ['regular', '300', '700']},
          { family: 'Open Sans', variants: ['regular', '400', '600']},
      ],
      path: "Fonts/"
    }))*/

    .addPlugin(new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [{
            source: '../Public/Images/*.webp',
            destination: './Assets/Images/',
          }],
        }, 
      },
    }))

    .addPlugin(new ImageminWebpWebpackPlugin({
      config: [{
        test: /\.(jpe?g|png|gif)/,
        options: {
          quality:  30
        }
      }],
    }))

    .addPlugin(plugins.StyleLintPlugin)
;

if(Encore.isProduction()) {
  Encore.addPlugin(
    new TerserPlugin({
      extractComments: false,
      terserOptions: {
        sourceMap: !Encore.isProduction(),
        //cache: !Encore.isProduction(),
        //parallel: true,
        output: {
          comments: false,
        },
      },
    })
  )
  Encore.addPlugin(new WorkboxPlugin.InjectManifest({
    swSrc: _config[_project.type].paths.assets+'/JavaScript/service-worker.js',
    swDest: '../Public/JavaScript/sw.js',
    exclude: [
      /\.map$/,
      /manifest$/,
      /\.htaccess$/,
      /service-worker\.js$/,
      /sw\.js$/,
    ],
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
  }))
}


// Exports the final configuration.
module.exports = Encore.getWebpackConfig();