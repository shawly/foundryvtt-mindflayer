"use strict";
const path = require("path");
const packages = require("./package.json");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

class ModuleJsonWebpackPlugin {
  static defaultOptions = {
    srcFile: "src/js/module.tmpl.json",
    outputFile: "module.json",
  };
  constructor(options = {}) {
    this.options = { ...ModuleJsonWebpackPlugin.defaultOptions, ...options };
  }
  apply(compiler) {
    const pluginName = ModuleJsonWebpackPlugin.name;
    const { webpack } = compiler;
    const { Compilation } = webpack;
    const { RawSource } = webpack.sources;
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        (assets) => {
          const content = JSON.parse(
            fs
              .readFileSync(this.options.srcFile)
              .toString()
              .replaceAll("{{version}}", packages.version)
          );
          content.version = packages.version;

          // Adding new asset to the compilation, so it would be automatically
          // generated by the webpack in the output directory.
          compilation.emitAsset(
            this.options.outputFile,
            new RawSource(JSON.stringify(content))
          );
        }
      );
    });
  }
}

let devDomain = "localhost";
if (fs.existsSync(".devDomain")) {
  devDomain = fs.readFileSync(".devDomain");
}

module.exports = {
  mode: process.env.NODE_ENV == "production" ? "production" : "development",
  entry: "./src/js/index.js",
  output: {
    filename: "MindFlayer.js",
    path: path.resolve(
      __dirname,
      process.env.NODE_ENV == "production"
        ? "dist"
        : "chrome-overrides/" +
            devDomain +
            "/modules/mindflayer-token-controller"
    ),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/lang", to: "lang" },
        { from: "src/templates", to: "templates" },
        { from: "LICENSE", to: "LICENSE" },
        { from: "src/style.css", to: "style.css" },
      ],
    }),
    new ModuleJsonWebpackPlugin(),
  ],
  optimization: {
    minimize: process.env.NODE_ENV == "production",
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
  devtool: "source-map",
};
