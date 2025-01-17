# Kitchen Orders System

Система управления заказами для кухни, интегрированная с Poster CRM.

## Структура проекта

Проект состоит из трех основных компонентов:

1. **order_system_api** - Backend API на Node.js/Express
   - Обработка вебхуков от Poster
   - Генерация и хранение чеков
   - WebSocket уведомления
   - MongoDB для хранения данных

2. **order_system_ng** - Frontend на Angular
   - Отображение активных и архивных заказов
   - Управление статусами заказов
   - Печать чеков
   - Интерактивный интерфейс кухни

3. **printexpress** - Сервис печати на Node.js
   - Обработка запросов на печать
   - Конвертация HTML чеков
   - Отправка на принтер

## Требования

- Node.js 16+
- Angular CLI
- MongoDB
- Printer drivers

## Установка

1. Клонируйте репозиторий:
```bash
git clone [repository-url]
```

2. Установите зависимости для каждого компонента:

```bash
# API
cd order_system_api
npm install

# Angular frontend
cd ../order_system_ng
npm install

# Print service
cd ../printexpress
npm install
```

3. Создайте файлы .env на основе .env.example в каждой директории.

4. Запустите MongoDB.

## Запуск

1. Запустите API:
```bash
cd order_system_api
npm run start
```

2. Запустите Angular frontend:
```bash
cd order_system_ng
ng serve
```

3. Запустите сервис печати:
```bash
cd printexpress
npm run start
```

## Конфигурация

### API (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/kitchen_orders
POSTER_ACCESS_TOKEN=your_token
POSTER_ACCOUNT=your_account
```

### Print Service (.env)
```
PORT=3001
PRINTER_NAME=your_printer_name
```

## Основные функции

- Получение заказов через вебхуки Poster
- Отображение заказов в реальном времени
- Управление статусами блюд
- Генерация и печать чеков
- Синхронизация меню с Poster
- Архивация выполненных заказов

## Разработка

### API
```bash
npm run dev
```

### Angular
```bash
ng serve
```

### Print Service
```bash
npm run dev
``` 