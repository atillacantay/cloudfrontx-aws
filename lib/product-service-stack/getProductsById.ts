import type { APIGatewayProxyEvent } from "aws-lambda";
import { ProductService } from "./services/product-service";
import {
  formatSuccessResponse,
  formatErrorResponse,
} from "./utils/response-formatter";

const productService = new ProductService();

export const main = async (event: APIGatewayProxyEvent) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return formatErrorResponse("Product ID is required", 400);
    }

    const product = await productService.getProductById(productId);

    if (!product) {
      return formatErrorResponse("Product not found", 404);
    }

    return formatSuccessResponse(product);
  } catch (error) {
    console.error("Error in getProductsById:", error);
    return formatErrorResponse(
      "Internal server error",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};
