const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const dist = path.resolve(__dirname, "dist");
const crate = path.resolve(__dirname, "rust");

module.exports = {
  mode: "production",
  entry: {
    index: "./js/bootstrap.js"
  },
  output: {
    path: dist,
    filename: "bootstrap.js"
  },
  devServer: {
    contentBase: dist,
  },
  plugins: [
    new CopyPlugin([
      path.resolve(__dirname, "static")
    ]),

    new WasmPackPlugin({
      crateDirectory: crate,
      extraArgs: "--out-name index --out-dir ../pkg"
    }),
  ]
};
