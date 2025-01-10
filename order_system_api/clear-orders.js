require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kitchen_orders';

async function clearOrders() {
  try {
    console.log('Подключение к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Удаляем все документы из коллекции orders
    const result = await mongoose.connection.collection('orders').deleteMany({});
    console.log(`✅ Удалено ${result.deletedCount} заказов`);

    console.log('Операция завершена');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

clearOrders(); 