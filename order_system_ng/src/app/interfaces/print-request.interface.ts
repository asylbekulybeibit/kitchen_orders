export interface PrintRequest {
  receipt_url: string;
  order_info: {
    order_id: string;
    product_name: string;
    modifications?: string[];
    ingredients?: string[];
  };
} 