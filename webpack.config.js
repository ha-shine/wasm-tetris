const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const dist = path.resolve(__dirname, "dist");
const crate = path.resolve(__dirname, "rust");

module.exports = {
    mode: "production",
    entry: {
        index: "./ts/bootstrap.js"
    },
    experiments: {
        syncWebAssembly: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: [/node_modules/, /pkg/]
            },
            {
                test: /\.png?$/i,
                type: "asset/resource"
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".wasm", ".json", ".png"],
        fallback: {
            util: require.resolve("util/")
        }
    },
    output: {
        path: dist,
        filename: "bootstrap.js"
    },
    devServer: {
        static: [
            {directory: dist, watch: true},
            {directory: path.resolve(__dirname, "static"), watch: true},
            {directory: path.resolve(__dirname, "rust/pkg"), watch: true},
        ]
    },
    plugins: [
        new CopyPlugin([path.resolve(__dirname, "static")]),

        new WasmPackPlugin({
            crateDirectory: crate,
            outDir: "../pkg",
            outName: "index"
        })
    ]
};
