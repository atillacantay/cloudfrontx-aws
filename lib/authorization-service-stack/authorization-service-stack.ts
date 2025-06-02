import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.basicAuthorizer = new lambda.Function(this, "BasicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: "index.main",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../dist/basicAuthorizer")
      ),
      environment: {
        [process.env.GITHUB_USERNAME || "atillacantay"]: "test123",
      },
    });

    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: this.basicAuthorizer.functionArn,
      description: "ARN of the Basic Authorizer Lambda function",
    });
  }
}
