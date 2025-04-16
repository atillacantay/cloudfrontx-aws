#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { CloudXAppStack } from "../lib/cloudx-app-stack";
import { ProductServiceStack } from "../lib/product-service-stack/product-service-stack";

const app = new cdk.App();

new ProductServiceStack(app, "ProductServiceStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new CloudXAppStack(app, "CloudXAppStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
