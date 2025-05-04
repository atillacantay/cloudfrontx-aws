import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "products",
    });

    const stockTable = new dynamodb.Table(this, "StockTable", {
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      tableName: "stock",
    });

    const createProduct = new lambda.Function(this, "CreateProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "index.main",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../dist/createProduct")
      ),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const getProductsList = new lambda.Function(this, "GetProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "index.main",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../dist/getProductsList")
      ),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const getProductsByIdLambdaFunction = new lambda.Function(
      this,
      "GetProductsById",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "index.main",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/getProductsById")
        ),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    productsTable.grantReadWriteData(createProduct);
    stockTable.grantReadWriteData(createProduct);
    productsTable.grantReadData(getProductsList);
    stockTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsByIdLambdaFunction);
    stockTable.grantReadData(getProductsByIdLambdaFunction);

    const api = new apigateway.RestApi(this, "products-api", {
      restApiName: "Atilla's Product Service API Gateway",
      description: "This API serves the Lambda functions.",
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProduct)
    );

    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList)
    );

    const productResource = productsResource.addResource("{productId}");
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLambdaFunction)
    );
  }
}
