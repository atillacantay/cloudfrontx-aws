import { main } from "../../lib/product-service-stack/getProductsList";
import { products } from "../../lib/product-service-stack/mock-products";

describe("getProductsList Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of products when successful", async () => {
    const result = await main();
    const parsedProducts = JSON.parse(result.body);

    expect(parsedProducts).toEqual(products);
  });
});
