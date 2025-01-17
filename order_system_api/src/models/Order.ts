import { Schema, Document, model } from 'mongoose';

export interface IOrderProduct {
  product_id: string;
  product_name: string;
  count: number;
  category_name: string;
  status?: string;
  receipt_url?: string;
  modifications?: any[];
  ingredients?: any[];
  units?: any[];
  [key: string]: any;
}

export interface IOrder extends Document {
  order_id: string;
  spot_id: string;
  table_id: string;
  table_name: string;
  client_id?: string;
  client_name?: string;
  sum: number;
  discount: number;
  total_sum: number;
  comment?: string;
  created_at: Date;
  updated_at: Date;
  status: 'new' | 'in_progress' | 'done' | 'archived';
  products: IOrderProduct[];
  [key: string]: any;
}

const OrderSchema = new Schema({
  order_id: { type: String, required: true, unique: true, index: true },
  spot_id: { type: String, required: true, index: true },
  table_id: { type: String, required: true },
  table_name: { type: String, required: true },
  client_id: String,
  client_name: String,
  sum: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total_sum: { type: Number, required: true },
  comment: String,
  status: {
    type: String,
    enum: ['new', 'in_progress', 'done', 'archived'],
    default: 'new',
    index: true
  },
  products: [{
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    count: { type: Number, required: true },
    category_name: String,
    status: String,
    receipt_url: String,
    modifications: [Schema.Types.Mixed],
    ingredients: [Schema.Types.Mixed],
    units: [Schema.Types.Mixed],
    _id: false
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  strict: false,
  id: false,
  toJSON: {
    virtuals: true,
    getters: true
  },
  toObject: {
    virtuals: true,
    getters: true
  }
});

// Создаем составной индекс для created_at в обратном порядке
OrderSchema.index({ created_at: -1 });

// Метод для проверки статуса всех позиций
OrderSchema.methods.updateOrderStatus = function(this: IOrder) {
  const allProductsStatuses = this.products.map(p => p.status);
  
  if (allProductsStatuses.every(status => status === 'done')) {
    this.status = 'done';
  } else if (allProductsStatuses.some(status => status === 'in_progress')) {
    this.status = 'in_progress';
  } else {
    this.status = 'new';
  }
  
  return this.save();
};

export const Order = model<IOrder>('Order', OrderSchema); 