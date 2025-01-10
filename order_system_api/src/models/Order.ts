import mongoose, { Schema } from 'mongoose';
import { IOrder, IOrderItem, IItemUnit, OrderItemStatus } from './interfaces';

const ItemUnitSchema = new Schema<IItemUnit>({
  id: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(OrderItemStatus),
    default: OrderItemStatus.NEW 
  },
  printed: { type: Boolean, default: false }
});

const OrderItemSchema = new Schema<IOrderItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  units: [ItemUnitSchema]
}, { _id: true });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true, default: 0 },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Индексы для быстрого поиска
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ isArchived: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema); 