import * as path from "path";
import * as webpack from "webpack";
import * as TerserPlugin from "terser-webpack-plugin";

const config: webpack.Configuration = {
  target: "node",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "source-map",
  entry: {
    getProductsList: "./lib/product-service-stack/getProductsList.ts",
    getProductsById: "./lib/product-service-stack/getProductsById.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/index.js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: process.env.NODE_ENV === "production",
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  plugins: [
    // Ignore unnecessary packages in aws-cdk
    new webpack.IgnorePlugin({
      resourceRegExp: /^aws-cdk$/,
    }),
  ],
};

export default config;
