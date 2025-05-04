export interface ProductWithStock {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}
export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  count: number;
}

export interface Stock {
  product_id: string;
  count: number;
}

export interface APIGatewayEvent {
  pathParameters?: {
    productId?: string;
  };
}

export interface ErrorResponse {
  message: string;
  error?: string;
}
