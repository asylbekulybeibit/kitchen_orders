const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kitchen_orders';

async function showOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Подключено к MongoDB');
    
    // Получаем все заказы
    const orders = await mongoose.connection.collection('orders').find({}).toArray();
    
    console.log('\nАктивные заказы:');
    const activeOrders = orders.filter(order => !order.isArchived);
    activeOrders.forEach(order => {
      console.log(`\nЗаказ #${order.orderId}`);
      console.log('Создан:', new Date(order.createdAt).toLocaleString());
      console.log('Позиции:');
      order.items.forEach(item => {
        console.log(`- ${item.name} x${item.quantity} (${item.price} ₸) - ${item.status}`);
      });
      console.log('Сумма:', order.totalAmount, '₸');
    });

    console.log('\nАрхивные заказы:');
    const archivedOrders = orders.filter(order => order.isArchived);
    archivedOrders.forEach(order => {
      console.log(`\nЗаказ #${order.orderId}`);
      console.log('Создан:', new Date(order.createdAt).toLocaleString());
      console.log('Позиции:', order.items.length);
      console.log('Сумма:', order.totalAmount, '₸');
    });

    console.log('\nВсего заказов:', orders.length);
    console.log('Активных:', activeOrders.length);
    console.log('В архиве:', archivedOrders.length);
    
    await mongoose.connection.close();
    console.log('\nСоединение с MongoDB закрыто');
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

showOrders(); 