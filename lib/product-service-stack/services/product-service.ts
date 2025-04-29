import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CreateProductRequest,
  Product,
  ProductWithStock,
  Stock,
} from "../types";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.CDK_DEFAULT_REGION,
});
const docClient = DynamoDBDocumentClient.from(client);
const productsTableName = process.env.PRODUCTS_TABLE_NAME || "products";
const stockTableName = process.env.STOCK_TABLE_NAME || "stock";

export class ProductService {
  async getProducts(): Promise<ProductWithStock[]> {
    console.log("ProductService: fetching all products");
    try {
      const productsCommand = new ScanCommand({
        TableName: productsTableName,
      });

      const productsResult = await docClient.send(productsCommand);
      const products = (productsResult.Items || []) as Product[];

      const stockCommand = new ScanCommand({
        TableName: stockTableName,
      });
      const stockResult = await docClient.send(stockCommand);
      const stockItems = (stockResult.Items as Stock[]) || [];

      const stockMap = new Map<string, number>();
      stockItems.forEach((item) => {
        stockMap.set(item.product_id, item.count);
      });

      const joinedProducts: ProductWithStock[] = products.map((product) => ({
        ...product,
        count: stockMap.get(product.id) || 0,
      }));

      return joinedProducts;
    } catch (error: unknown) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<ProductWithStock | undefined> {
    console.log(`ProductService: fetching product with id ${id}`);
    try {
      const productCommand = new GetCommand({
        TableName: productsTableName,
        Key: { id },
      });
      const productResult = await docClient.send(productCommand);

      if (!productResult.Item) {
        return undefined;
      }

      const stockCommand = new GetCommand({
        TableName: stockTableName,
        Key: { product_id: id },
      });
      const stockResult = await docClient.send(stockCommand);

      const joinedProduct: ProductWithStock = {
        ...(productResult.Item as Product),
        count: stockResult.Item ? (stockResult.Item as Stock).count : 0,
      };

      return joinedProduct;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  async createProduct(
    productData: CreateProductRequest
  ): Promise<ProductWithStock> {
    console.log("ProductService: adding new product", productData);
    try {
      const productId = uuidv4();

      const product: Product = {
        id: productId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
      };

      const productCommand = new PutCommand({
        TableName: productsTableName,
        Item: product,
      });
      await docClient.send(productCommand);

      const stockCommand = new PutCommand({
        TableName: stockTableName,
        Item: {
          product_id: productId,
          count: productData.count,
        },
      });
      await docClient.send(stockCommand);

      return {
        ...product,
        count: productData.count,
      };
    } catch (error) {
      console.error("Error adding new product:", error);
      throw error;
    }
  }
}
