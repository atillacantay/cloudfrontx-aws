import { ProductService } from "./services/product-service";
import { products } from "./mock-products";
import { z } from "zod";

const productService = new ProductService();

// Define validation schema using Zod
const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  count: z.number().int().nonnegative("Count must be a non-negative integer"),
});

async function initializeDatabase() {
  console.log("Starting database initialization...");
  console.log(`Found ${products.length} products to add to the database.`);

  for (const product of products) {
    try {
      console.log(`Validating product: ${product.title}`);

      // Generate random count between 1 and 10
      const count = Math.floor(Math.random() * 10) + 1;

      // Create product data object
      const productData = {
        title: product.title,
        description: product.description,
        price: product.price,
        count,
      };

      // Validate product data
      const validationResult = createProductSchema.safeParse(productData);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        console.error(
          `Validation error for product ${product.title}: ${errorMessages}`
        );
        continue; // Skip this product and move to the next one
      }

      // If validation passes, create the product
      console.log(`Adding product: ${product.title}`);
      await productService.createProduct(validationResult.data);
      console.log(`Successfully added product: ${product.title}`);
    } catch (error) {
      console.error(`Failed to add product ${product.title}:`, error);
    }
  }

  console.log("Database initialization completed!");
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log("All products have been processed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during database initialization:", error);
    process.exit(1);
  });
