import { main } from "../../lib/product-service-stack/getProductsById";
import { products } from "../../lib/product-service-stack/mock-products";
import {
  APIGatewayEvent,
  ErrorResponse,
  Product,
} from "../../lib/product-service-stack/types";

describe("getProductsById Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a product when valid ID is provided", async () => {
    const productId = products[0].id;
    const event: APIGatewayEvent = {
      pathParameters: { productId },
    };

    const result = await main(event);
    const parsedProduct = JSON.parse(result.body) as Product;

    expect(parsedProduct.id).toEqual(productId);
  });

  it("should return 404 when product is not found", async () => {
    const event: APIGatewayEvent = {
      pathParameters: { productId: "000" },
    };

    const result = await main(event);
    const parsedBody = JSON.parse(result.body) as ErrorResponse;

    expect(result.statusCode).toEqual(404);
    expect(parsedBody.message).toEqual("Product not found");
  });

  it("should return 400 when product ID is missing", async () => {
    const event: APIGatewayEvent = {
      pathParameters: {},
    };

    const result = await main(event);
    const parsedBody = JSON.parse(result.body) as ErrorResponse;

    expect(result.statusCode).toEqual(400);
    expect(parsedBody.message).toEqual("Product ID is required");
  });
});
