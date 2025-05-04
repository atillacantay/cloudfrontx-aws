import type { APIGatewayProxyEvent } from "aws-lambda";
import { ProductService } from "./services/product-service";
import {
  formatSuccessResponse,
  formatErrorResponse,
} from "./utils/response-formatter";
import { z } from "zod";

const productService = new ProductService();

const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  count: z.number().int().nonnegative("Count must be a non-negative integer"),
});

export const main = async (event: APIGatewayProxyEvent) => {
  console.log("createProduct Lambda invoked with event:", event);

  try {
    const requestBody = event.body ? JSON.parse(event.body) : null;

    if (!requestBody) {
      return formatErrorResponse("Request body is required", 400);
    }

    const validationResult = createProductSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return formatErrorResponse(`Validation error`, 400, errorMessages);
    }

    const { title, description, price, count } = validationResult.data;

    const newProduct = await productService.createProduct({
      title,
      description,
      price,
      count,
    });

    return formatSuccessResponse(newProduct, 201);
  } catch (error) {
    console.error("Error in createProduct Lambda:", error);
    return formatErrorResponse(
      "Internal server error",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};
