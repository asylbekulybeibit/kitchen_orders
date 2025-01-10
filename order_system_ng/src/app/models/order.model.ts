export type OrderItemStatus = 'new' | 'in_progress' | 'done';

export interface ItemUnit {
  status: OrderItemStatus;
  printed: boolean;
  completedAt?: string;
}

export interface OrderItem {
  _id: string;
  name: string;
  price: number;
  units: ItemUnit[];
}

export interface Order {
  _id: string;
  orderId: string;
  createdAt: string;
  items: OrderItem[];
  isArchived: boolean;
  totalAmount: number;
}

export interface PrintData {
  itemName: string;
  orderId: string;
  completedAt?: string;
} 