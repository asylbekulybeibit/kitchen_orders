import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/database";
import ordersRouter from "./routes/orders";
import { Order } from "./models/order.model";
import mongoose from "mongoose";
import fetch from "node-fetch";
import path from "path";
import receiptRoutes from "./routes/receiptRoutes";

// Функция для получения информации о товаре из Poster
async function getProductInfo(productId: number) {
  try {
    const token = process.env.POSTER_ACCESS_TOKEN;
    const url = `https://joinposter.com/api/menu.getProduct?token=${token}&product_id=${productId}`;
    console.log(`🔍 Запрос к API Poster: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ Ответ API Poster для товара ${productId}:`, JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error(`❌ Ошибка API Poster для товара ${productId}:`, data.error);
      return null;
    }
    
    return data.response;
  } catch (error) {
    console.error(`❌ Ошибка при получении информации о товаре ${productId}:`, error);
    return null;
  }
}

// Инициализация Express приложения
const app = express();
const httpServer = createServer(app);

// Настройка CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Настройка парсинга JSON
app.use(express.json({ limit: "10mb" }));

// Статические файлы для чеков
app.use('/receipts', express.static(path.join(process.cwd(), 'receipts')));

// Логирование всех запросов
app.use((req, res, next) => {
  console.log("\n=== Входящий запрос ===");
  console.log("Время:", new Date().toISOString());
  console.log("Метод:", req.method);
  console.log("URL:", req.url);
  console.log("Заголовки:", JSON.stringify(req.headers, null, 2));
  console.log("Тело запроса:", JSON.stringify(req.body, null, 2));
  console.log("========================\n");
  next();
});

// Настройка Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

// WebSocket подключения
io.on("connection", (socket) => {
  console.log("👤 Новое WebSocket подключение:", socket.id);

  socket.on("disconnect", () => {
    console.log("👤 WebSocket отключен:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("❌ Ошибка WebSocket:", error);
  });

  // Подтверждение подключения
  socket.emit("connected", { message: "Успешное подключение к серверу" });
});

// Отслеживание всех WebSocket событий
io.engine.on("connection_error", (err) => {
  console.error("❌ Ошибка подключения WebSocket:", err);
});

// Маршрут для вебхука Poster
app.post("/webhook/poster", async (req, res) => {
  try {
    console.log("\n=== НОВЫЙ ВЕБХУК ОТ POSTER ===");
    console.log("📥 Тело запроса:", JSON.stringify(req.body, null, 2));
    console.log("📥 Тип объекта:", req.body.object);
    console.log("📥 Действие:", req.body.action);
    
    // Проверяем тип события
    if (req.body.object === 'transaction' && req.body.action === 'closed') {
      console.log("✅ Получен закрытый заказ");
      
      const data = JSON.parse(req.body.data);
      console.log("📦 Распарсенные данные:", JSON.stringify(data, null, 2));
      
      const transactionHistory = data.transactions_history;
      console.log("📦 История транзакции:", JSON.stringify(transactionHistory, null, 2));
      
      const parsedValueText = JSON.parse(transactionHistory.value_text);
      console.log("📦 Распарсенный value_text:", JSON.stringify(parsedValueText, null, 2));
      
      const products = parsedValueText.products;
      console.log("📦 Продукты:", JSON.stringify(products, null, 2));
      
      // Получаем информацию о каждом товаре через API Poster
      const itemsPromises = products.map(async (product: any) => {
        console.log(`\n📦 Обрабатываем товар:`, JSON.stringify(product, null, 2));
        
        const productInfo = await getProductInfo(product.id);
        console.log(`ℹ️ Информация о товаре ${product.id} из API:`, JSON.stringify(productInfo, null, 2));
        
        // Извлекаем цену из объекта
        let price = 0;
        if (typeof product.price === 'object' && product.price !== null) {
          const priceValues = Object.values(product.price);
          const firstPrice = priceValues[0];
          price = priceValues.length > 0 && typeof firstPrice === 'string' ? parseFloat(firstPrice) : 0;
        } else if (typeof product.price === 'string' || typeof product.price === 'number') {
          price = parseFloat(product.price.toString());
        }
        
        // Определяем название товара
        let name = product.product_name;
        if (!name && productInfo) {
          name = productInfo.product_name;
        }
        if (!name) {
          name = `Товар ${product.id}`;
        }
        console.log(`📝 Название товара:`, name);
        
        const item = {
          name,
          quantity: product.count,
          price: price || (transactionHistory.value2 / 100 / product.count),
          units: Array(product.count).fill(null).map(() => ({
            id: new mongoose.Types.ObjectId().toString(),
            status: 'new',
            printed: false
          }))
        };
        console.log("✅ Создан item:", JSON.stringify(item, null, 2));
        return item;
      });
      
      const items = await Promise.all(itemsPromises);
      console.log("📦 Все items:", JSON.stringify(items, null, 2));
      
      // Создаем новый заказ в MongoDB
      const newOrder = new Order({
        orderId: `POS-${req.body.object_id}`,
        createdAt: new Date(parseInt(transactionHistory.time)),
        items,
        isArchived: false,
        totalAmount: transactionHistory.value2 / 100
      });

      console.log("📋 Подготовленный заказ:", JSON.stringify(newOrder.toObject(), null, 2));

      // Сохраняем заказ
      const savedOrder = await newOrder.save();
      console.log("✅ Создан новый заказ:", JSON.stringify(savedOrder.toObject(), null, 2));

      // Оповещаем всех клиентов через WebSocket
      io.emit('newOrder', savedOrder);
      console.log("📡 Отправлено WebSocket уведомление");

      res.status(200).json({ 
        status: "success",
        message: "Заказ успешно создан",
        order: savedOrder
      });
    } else {
      console.log("ℹ️ Пропущено событие:", {
        object: req.body.object,
        action: req.body.action,
        data: req.body.data
      });
      res.status(200).json({ 
        status: "skipped",
        message: "Событие не требует обработки"
      });
    }
  } catch (error) {
    console.error("❌ Ошибка при обработке вебхука:", error);
    console.error("Детали ошибки:", error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error);
    res.status(500).json({ 
      status: "error",
      message: "Ошибка при создании заказа",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Корневой маршрут для проверки
app.get("/", (req, res) => {
  res.json({
    message: "Kitchen Orders API",
    status: "running",
    endpoints: {
      webhook: "/webhook/poster",
      orders: "/api/orders",
      activeOrders: "/api/orders/active",
      archivedOrders: "/api/orders/archive",
      updateUnitStatus: "/api/orders/:orderId/unit-status",
      updateUnitPrint: "/api/orders/:orderId/unit-print",
      archiveOrder: "/api/orders/:orderId/archive"
    },
  });
});

// Подключение маршрутов
app.use("/api/orders", ordersRouter);
app.use("/api/receipts", receiptRoutes);

// Обработка 404
app.use((req, res) => {
  console.log("404 - Маршрут не найден:", req.url);
  res.status(404).json({
    message: "Маршрут не найден",
    requestedUrl: req.url,
    availableEndpoints: {
      webhook: "/webhook/poster",
      orders: "/api/orders",
      activeOrders: "/api/orders/active",
      archivedOrders: "/api/orders/archive",
      updateUnitStatus: "/api/orders/:orderId/unit-status",
      updateUnitPrint: "/api/orders/:orderId/unit-print",
      archiveOrder: "/api/orders/:orderId/archive"
    },
  });
});

// Глобальная обработка ошибок
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Глобальная ошибка:", err);
    res
      .status(500)
      .json({ message: "Внутренняя ошибка сервера", error: err.message });
  }
);

// Запуск сервера
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Подключение к MongoDB
    await connectDB();

    // Запуск HTTP сервера
    httpServer.listen(PORT, () => {
      console.log(`✅ Сервер запущен на порту ${PORT}`);
      console.log(`✅ WebSocket сервер готов к подключениям`);
      console.log(`✅ API доступно по адресу http://localhost:${PORT}/api`);
    });

    // Обработка ошибок сервера
    httpServer.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Порт ${PORT} уже используется`);
        process.exit(1);
      } else {
        console.error("❌ Ошибка сервера:", error);
      }
    });
  } catch (error) {
    console.error("❌ Ошибка при запуске сервера:", error);
    process.exit(1);
  }
};

// Обработка необработанных исключений
process.on("uncaughtException", (error) => {
  console.error("❌ Необработанное исключение:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Необработанное отклонение промиса:", error);
  process.exit(1);
});

startServer();
