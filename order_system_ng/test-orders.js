import fetch from 'node-fetch';

const menuItems = [
  { name: 'Бургер классический', price: 2500 },
  { name: 'Картофель фри', price: 800 },
  { name: 'Пицца Маргарита', price: 3000 },
  { name: 'Цезарь с курицей', price: 2800 },
  { name: 'Паста Карбонара', price: 2500 },
  { name: 'Суп грибной', price: 1200 },
  { name: 'Стейк говяжий', price: 5500 },
  { name: 'Салат греческий', price: 1800 },
  { name: 'Роллы Филадельфия', price: 3500 },
  { name: 'Лимонад', price: 600 }
];

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getRandomItems() {
  const itemCount = Math.floor(Math.random() * 3) + 2; // 2-4 позиции
  const items = [];
  
  for (let i = 0; i < itemCount; i++) {
    const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 штуки
    
    // Создаем отдельную позицию для каждой единицы товара
    for (let j = 0; j < quantity; j++) {
      items.push({
        _id: generateId(),
        name: menuItem.name,
        quantity: 1, // Всегда 1, так как это отдельная единица
        price: menuItem.price,
        status: 'new',
        printed: false
      });
    }
  }
  
  return items;
}

async function createOrder(index) {
  const items = getRandomItems();
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  
  const order = {
    _id: generateId(),
    orderId: `TEST${String(index + 1).padStart(3, '0')}`,
    items: items,
    totalAmount: totalAmount,
    createdAt: new Date().toISOString(),
    isArchived: false,
    status: 'new'
  };

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    });
    
    if (response.ok) {
      console.log(`Заказ ${order.orderId} создан успешно:`, JSON.stringify(order, null, 2));
    } else {
      const errorText = await response.text();
      console.error(`Ошибка при создании заказа ${order.orderId}:`, errorText);
    }
  } catch (error) {
    console.error(`Ошибка при отправке заказа ${order.orderId}:`, error);
  }
}

async function createTestOrders() {
  for (let i = 0; i < 10; i++) {
    await createOrder(i);
    // Небольшая задержка между заказами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('Все тестовые заказы созданы');
}

createTestOrders(); 