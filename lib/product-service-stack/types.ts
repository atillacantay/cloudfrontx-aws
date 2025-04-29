export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
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
