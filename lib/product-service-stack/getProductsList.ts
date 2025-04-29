import { ProductService } from "./services/product-service";
import {
  formatSuccessResponse,
  formatErrorResponse,
} from "./utils/response-formatter";

const productService = new ProductService();

export const main = async () => {
  console.log("getProductsList Lambda invoked");

  try {
    const products = await productService.getProducts();
    return formatSuccessResponse(products);
  } catch (error) {
    console.error("Error in getProductsList:", error);
    return formatErrorResponse(
      "Internal server error",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};
