import { Document, Types } from 'mongoose';

export enum OrderItemStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export interface IItemUnit {
  id: string;
  status: OrderItemStatus;
  printed: boolean;
}

export interface IOrderItem {
  _id?: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  units: IItemUnit[];
}

export interface IOrder extends Document {
  orderId: string;
  items: IOrderItem[];
  totalAmount: number;
  isArchived: boolean;
  createdAt: Date;
} 