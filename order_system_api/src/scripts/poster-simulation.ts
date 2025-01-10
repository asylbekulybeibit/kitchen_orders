import axios, { AxiosError } from 'axios';
import { OrderItemStatus } from '../models/interfaces';

const API_URL = 'http://localhost:3000/api/orders';

const MENU_ITEMS = [
  { name: 'Бургер', price: 250 },
  { name: 'Картофель фри', price: 150 },
  { name: 'Пицца Маргарита', price: 450 },
  { name: 'Кола', price: 100 },
  { name: 'Суши Филадельфия', price: 550 },
  { name: 'Мисо суп', price: 200 },
  { name: 'Салат Цезарь', price: 350 },
  { name: 'Лимонад', price: 150 },
  { name: 'Стейк', price: 800 },
  { name: 'Картофельное пюре', price: 150 },
  { name: 'Овощи гриль', price: 200 }
];

function generateRandomOrder() {
  const itemsCount = Math.floor(Math.random() * 3) + 1; // 1-3 позиции
  const items = [];
  let totalAmount = 0;

  for (let i = 0; i < itemsCount; i++) {
    const menuItem = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 единицы

    // Создаем units для каждой единицы товара
    const units = Array(quantity).fill(null).map((_, index) => ({
      id: `${Date.now()}-${i}-${index}`,
      status: OrderItemStatus.NEW,
      printed: false
    }));

    const item = {
      name: menuItem.name,
      quantity,
      price: menuItem.price,
      units
    };

    items.push(item);
    totalAmount += menuItem.price * quantity;
  }

  return {
    orderId: `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    items,
    totalAmount,
    isArchived: false,
    createdAt: new Date()
  };
}

async function createTestOrder() {
  try {
    const order = generateRandomOrder();
    console.log('Создание тестового заказа:', order.orderId);
    const response = await axios.post(API_URL, order);
    console.log('Заказ создан:', response.data.orderId);
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Ошибка при создании тестового заказа:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.data);
      }
    } else {
      console.error('Неизвестная ошибка:', error);
    }
  }
}

// Создаем новый заказ каждые 30 секунд
console.log('Запуск симуляции заказов...');
createTestOrder(); // Создаем первый заказ сразу
setInterval(createTestOrder, 30000);

// Обработка завершения скрипта
process.on('SIGINT', () => {
  console.log('\nЗавершение симуляции заказов');
  process.exit();
}); 