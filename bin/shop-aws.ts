#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { CloudXAppStack } from "../lib/cloudx-app-stack";
import { ProductServiceStack } from "../lib/product-service-stack/product-service-stack";
import { ImportServiceStack } from "../lib/import-service-stack/import-service-stack";
import { AuthorizationServiceStack } from "../lib/authorization-service-stack/authorization-service-stack";

const app = new cdk.App();

new AuthorizationServiceStack(app, "AuthorizationServiceStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const productServiceStack = new ProductServiceStack(
  app,
  "ProductServiceStack",
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

new ImportServiceStack(app, "ImportServiceStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  catalogItemsQueue: productServiceStack.catalogItemsQueue,
});

new CloudXAppStack(app, "CloudXAppStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
