import mongoose from 'mongoose';

// Статус единицы позиции
export type OrderItemStatus = 'new' | 'in_progress' | 'done';

// Схема для единицы позиции
const orderItemUnitSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['new', 'in_progress', 'done'],
    default: 'new'
  },
  printed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Схема для позиции заказа
const orderItemSchema = new mongoose.Schema({
  _id: String,
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  units: [orderItemUnitSchema]
});

// Основная схема заказа
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  items: [orderItemSchema],
  isArchived: {
    type: Boolean,
    default: false
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

// Проверяем, существует ли уже модель
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export interface IOrderItemUnit {
  status: OrderItemStatus;
  printed: boolean;
  completedAt?: Date;
}

export interface IOrderItem {
  _id: string;
  name: string;
  price: number;
  units: IOrderItemUnit[];
}

export interface IOrder {
  _id: string;
  orderId: string;
  createdAt: Date;
  items: IOrderItem[];
  isArchived: boolean;
  totalAmount: number;
} 