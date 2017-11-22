const path = require('path');

const config = {
    context: __dirname,
    entry: ['babel-polyfill', './src/index.js'],
    //devtool: "cheap-eval-source-map",
    output: {
        path: path.join(__dirname, 'public'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    stats: {
        colors: true,
        reasons: true
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: path.join(__dirname, './src'),
                loader: 'babel-loader'
            }
        ]
    }
}

if (process.env.NODE_ENV === 'production') {
    config.entry = ['babel-polyfill', './src/index.js'];
    config.devtool = false;
}

module.exports = config;