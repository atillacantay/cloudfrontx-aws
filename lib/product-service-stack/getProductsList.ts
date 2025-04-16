import { products } from "./mock-products";

export async function main() {
  return {
    body: JSON.stringify(products),
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };
}
