import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kitchen_orders';

export const connectDB = async () => {
  try {
    console.log('Попытка подключения к MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB успешно подключена');
    
    // Проверяем существование коллекции
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('База данных не инициализирована');
    }

    const collections = await db.listCollections().toArray();
    console.log('Существующие коллекции:', collections.map(c => c.name));
    
    if (!collections.find(c => c.name === 'orders')) {
      console.log('Создаем коллекцию orders...');
      await db.createCollection('orders');
      console.log('Коллекция orders успешно создана');
    }
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB отключена');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Ошибка MongoDB:', err);
}); 