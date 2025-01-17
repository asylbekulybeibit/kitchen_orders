# Kitchen Orders System

Система управления заказами для кухни с интеграцией Poster CRM, веб-интерфейсом и поддержкой печати чеков.

## Возможности

- 🔄 Интеграция с Poster CRM через вебхуки
- 🖥️ Веб-интерфейс для кухни на Angular
- 🖨️ Кроссплатформенная печать чеков
- ⚡ WebSocket для обновлений в реальном времени
- 📦 MongoDB для хранения данных
- 🔄 Синхронизация меню с Poster
- 📊 Управление статусами заказов
- 📝 Генерация и хранение чеков

## Структура проекта

```
kitchen_orders/
├── order_system_api/     # Backend API (Node.js/Express)
├── order_system_ng/      # Frontend (Angular)
└── printexpress/         # Сервис печати (Node.js)
```

### Backend API (order_system_api)

- Node.js + Express
- MongoDB для хранения данных
- WebSocket для real-time уведомлений
- Интеграция с Poster CRM
- Генерация чеков в HTML

### Frontend (order_system_ng)

- Angular 16+
- Адаптивный дизайн
- Темная тема
- Real-time обновления
- Управление статусами заказов

### Сервис печати (printexpress)

- Кроссплатформенная печать (Windows, macOS, Linux)
- Конвертация HTML в PDF
- Поддержка различных принтеров
- Автоматическое определение системы

## Требования

- Node.js 16+
- Angular CLI
- MongoDB 4+
- Принтер с поддержкой системной печати

### Дополнительные требования по ОС

#### Windows
- SumatraPDF или совместимый PDF принтер

#### macOS
- CUPS (обычно предустановлен)

#### Linux
- CUPS и cups-client

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/kitchen_orders.git
cd kitchen_orders
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

3. Создайте файлы конфигурации:
```bash
# В каждой директории
cp .env.example .env
```

4. Настройте переменные окружения в файлах .env

## Запуск

1. Запустите MongoDB

2. Запустите API:
```bash
cd order_system_api
npm start
```

3. Запустите Angular frontend:
```bash
cd order_system_ng
ng serve
```

4. Запустите сервис печати:
```bash
cd printexpress
npm start
```

## Разработка

### API
```bash
cd order_system_api
npm run dev
```

### Frontend
```bash
cd order_system_ng
ng serve
```

### Print Service
```bash
cd printexpress
npm run dev
```

## Тестирование

1. Создание тестовых заказов:
```bash
curl -X POST http://localhost:3000/api/test/generate-orders -H "Content-Type: application/json" -d '{"count": 5}'
```

2. Тестирование печати:
```bash
curl -X POST http://localhost:3001/print -H "Content-Type: application/json" -d '{"receiptUrl": "http://localhost:3000/receipts/test.html"}'
```

## Лицензия

MIT

## Поддержка

При возникновении проблем создавайте issue в репозитории. 