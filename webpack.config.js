const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const staticFileServer = require('./staticFileServer');

const devServerPort = 4444;
const staticServerPort = 4445;

const cfg = {
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'build'),
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader',
                options: {transpileOnly: true},
            }],
        }, {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
        }],
    },
    plugins: [],
};

if (process.env.NODE_ENV === 'dev') {
    cfg.devtool = 'inline-source-map';
    cfg.devServer = {
        contentBase: './build',
        // compress: true,
        port: devServerPort,
        open: true,
        proxy: {'/resources': 'http://localhost:' + staticServerPort,},
        after: () => staticFileServer.start(staticServerPort),
    };
} else {
    const prodPlugins = [
        new UglifyJsPlugin({sourceMap: true}),
    ];

    cfg.plugins.concat(prodPlugins);
}

module.exports = cfg;
