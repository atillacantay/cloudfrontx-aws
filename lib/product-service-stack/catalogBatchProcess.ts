import { SQSEvent } from "aws-lambda";
import { ProductService } from "./services/product-service";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import type { ProductWithStock } from "./types";
import {
  formatSuccessResponse,
  formatErrorResponse,
} from "./utils/response-formatter";

const productService = new ProductService();
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";

const sendSnsNotification = async (newProduct: ProductWithStock) => {
  if (!SNS_TOPIC_ARN) return;

  await snsClient.send(
    new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: "New Product Created",
      Message: JSON.stringify({
        message: "New product has been created",
        product: newProduct,
      }),
    })
  );
  console.log("SNS notification sent for product:", newProduct.id);
};

export const main = async (event: SQSEvent) => {
  console.log(
    "catalogBatchProcess Lambda invoked with event:",
    JSON.stringify(event, null, 2)
  );

  try {
    for (const record of event.Records) {
      try {
        const productData: ProductWithStock = JSON.parse(record.body);
        console.log("Processing product:", productData);

        if (!productData) {
          console.error("Invalid or empty product data received:", productData);
          continue;
        }

        const { title, description, price, count } = productData;

        const newProduct = await productService.createProduct({
          title,
          description,
          price,
          count,
        });

        console.log("Product created successfully:", newProduct);

        await sendSnsNotification(newProduct);
      } catch (error) {
        console.error("Error processing record:", error);
        // Continue processing other records
      }
    }

    return formatSuccessResponse({
      message: "Batch processing completed",
    });
  } catch (error) {
    console.error("Error in catalogBatchProcess Lambda:", error);
    return formatErrorResponse(
      "Error processing batch",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};
