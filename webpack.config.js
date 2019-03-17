const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports.entry = {
    content: './src/content/index.ts',
    popup: './src/popup/js/index.tsx',
    options: './src/options/js/index.tsx'
};

module.exports.devtool = 'inline-source-map';

module.exports.module = {};
module.exports.module.rules = [
    {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
    },
    {
        test: /\.s[ac]ss$/,
        use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
            { loader: 'sass-loader' }
        ]
    },
    {
        test: /\.css$/,
        use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' }
        ]
    },
    {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        use: {
            loader: "url-loader",
            options: {
                limit: 50000,
                mimetype: "application/font-woff",
                name: "./fonts/[name].[ext]",
            }
        },
    }
];

const baseHtmlConfig = {
    title: 'KPJS',
    inject: true,
    template: require('html-webpack-template'),
    appMountId: 'app',
};

module.exports.plugins = [];
module.exports.plugins.push(
    new HtmlWebpackPlugin({
        ...baseHtmlConfig,
        filename: 'popup.html',
        chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
        ...baseHtmlConfig,
        filename: 'options.html',
        chunks: ['options'],
    })
);

module.exports.resolve = { extensions: [ '.tsx', '.ts', '.js', '.json' ] };

module.exports.output = {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
};
module.exports.optimization = {
    splitChunks: {
        chunks: 'all',
    },
};
