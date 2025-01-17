import { Schema, Document, model } from 'mongoose';

export interface IProduct extends Document {
  product_id: string;
  product_name: string;
  menu_category_id: string;
  [key: string]: any;
}

const ProductSchema = new Schema({
  product_id: { type: String, required: true, unique: true, index: true },
  product_name: { type: String, required: true },
  menu_category_id: { type: String, required: true, index: true }
}, {
  strict: false,
  timestamps: true
});

export const Product = model<IProduct>('Product', ProductSchema); 