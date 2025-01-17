export interface OrderModification {
  name: string;
  [key: string]: any;
}

export interface OrderIngredient {
  name: string;
  removed?: boolean;
  [key: string]: any;
}

export interface ProductUnit {
  status: 'new' | 'cooking' | 'ready';
  comment?: string;
  receipt_url?: string;
  [key: string]: any;
}

export interface OrderProduct {
  product_id: string;
  product_name: string;
  count: number;
  category_name: string;
  modifications?: OrderModification[];
  ingredients?: OrderIngredient[];
  units: ProductUnit[];
  [key: string]: any;
}

export interface Order {
  order_id: string;
  spot_id: string;
  table_id: string;
  client_id: string;
  status: string;
  created_at: string;
  products: OrderProduct[];
  receipt_url?: string;
  [key: string]: any;
}

export interface PrintRequest {
  receipt_url: string;
  order_info: {
    order_id: string;
    product_name: string;
    modifications?: OrderModification[];
    ingredients?: OrderIngredient[];
    comment?: string;
    [key: string]: any;
  };
  [key: string]: any;
} 