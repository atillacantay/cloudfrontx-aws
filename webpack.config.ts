import * as path from "path";
import * as webpack from "webpack";
import * as TerserPlugin from "terser-webpack-plugin";

const config: webpack.Configuration = {
  target: "node",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "source-map",
  entry: {
    createProduct: "./lib/product-service-stack/createProduct.ts",
    getProductsList: "./lib/product-service-stack/getProductsList.ts",
    getProductsById: "./lib/product-service-stack/getProductsById.ts",
    initializeDb: "./lib/product-service-stack/initialize-db.ts",
    catalogBatchProcess: "./lib/product-service-stack/catalogBatchProcess.ts",
    importProductsFile: "./lib/import-service-stack/importProductsFile.ts",
    importFileParser: "./lib/import-service-stack/importFileParser.ts",
    basicAuthorizer: "./lib/authorization-service-stack/basicAuthorizer.ts",
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
