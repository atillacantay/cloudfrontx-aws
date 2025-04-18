import { Product } from "../types";
import { products } from "../mock-products";

export class ProductService {
  async getProducts(): Promise<Product[]> {
    console.log("ProductService: fetching all products");
    try {
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    console.log(`ProductService: fetching product with id ${id}`);
    try {
      return products.find((product) => product.id === id);
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }
}
