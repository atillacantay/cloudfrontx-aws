import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as path from "path";
import { Construct } from "constructs";

interface ImportServiceStackProps extends cdk.StackProps {
  catalogItemsQueue: sqs.Queue;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ImportServiceStackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: `product-import-bucket-${this.account}`,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const importProductsFile = new lambda.Function(this, "ImportProductsFile", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      handler: "index.main",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../dist/importProductsFile")
      ),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
        UPLOADED_FOLDER: "uploaded",
      },
    });

    const importFileParser = new lambda.Function(this, "ImportFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      handler: "index.main",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../dist/importFileParser")
      ),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
        UPLOADED_FOLDER: "uploaded",
        PARSED_FOLDER: "parsed",
        CATALOG_ITEMS_QUEUE_URL: props?.catalogItemsQueue.queueUrl || "",
      },
    });

    const importProductsFilePolicy = new iam.PolicyStatement({
      actions: ["s3:PutObject"],
      resources: [`${importBucket.bucketArn}/uploaded/*`],
    });
    importProductsFile.addToRolePolicy(importProductsFilePolicy);

    const importFileParserPolicy = new iam.PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources: [
        `${importBucket.bucketArn}/uploaded/*`,
        `${importBucket.bucketArn}/parsed/*`,
      ],
    });
    importFileParser.addToRolePolicy(importFileParserPolicy);

    if (props?.catalogItemsQueue.queueArn) {
      props.catalogItemsQueue.grantSendMessages(importFileParser);
    }

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    const basicAuthorizerFunction = lambda.Function.fromFunctionArn(
      this,
      "BasicAuthorizer",
      `arn:aws:lambda:${this.region}:${this.account}:function:AuthorizationServiceStack-BasicAuthorizer2B49C1FC-SUwC8BzGsY9g`
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "ApiGatewayAuthorizer",
      {
        handler: basicAuthorizerFunction,
        identitySource: "method.request.header.Authorization",
      }
    );

    const api = new apigateway.RestApi(this, "import-service-api", {
      restApiName: "Atilla's Import Service API",
      description: "This API serves the Import Service functions",
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile, { proxy: true }),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
        authorizer: authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );

    importResource.addCorsPreflight({
      allowOrigins: [
        "https://d3tp9ygejbpchq.cloudfront.net",
        "http://localhost:3008",
      ],
      allowMethods: ["GET", "PUT", "OPTIONS"],
      allowCredentials: true,
    });

    new cdk.CfnOutput(this, "ImportServiceApiUrl", {
      value: api.url,
      description: "URL of the Import Service API",
    });
  }
}
