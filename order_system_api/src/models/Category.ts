import { Schema, Document, model } from 'mongoose';

export interface ICategory extends Document {
  category_id: string;
  category_name: string;
  [key: string]: any;
}

const CategorySchema = new Schema({
  category_id: { type: String, required: true, unique: true, index: true },
  category_name: { type: String, required: true }
}, {
  strict: false,
  timestamps: true
});

export const Category = model<ICategory>('Category', CategorySchema); 