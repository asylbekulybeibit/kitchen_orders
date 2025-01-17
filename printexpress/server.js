const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { print } = require('./printer');

const app = express();
const port = process.env.PORT || 3001;
const apiBaseUrl = 'http://localhost:3000'; // Базовый URL API

// Middleware
app.use(cors());
app.use(express.json());

// Маршрут для печати чека
app.post('/print', async (req, res) => {
  try {
    const { receiptUrl } = req.body;

    if (!receiptUrl) {
      return res.status(400).json({ error: 'Receipt URL is required' });
    }

    // Формируем полный URL чека
    const fullReceiptUrl = receiptUrl.startsWith('http') ? receiptUrl : `${apiBaseUrl}${receiptUrl}`;
    console.log('Получен запрос на печать чека:', fullReceiptUrl);
    console.log('Тело запроса:', req.body);

    try {
      // Загружаем HTML чека
      const response = await axios.get(fullReceiptUrl);
      const receiptHtml = response.data;
      console.log('HTML чека загружен успешно');

      console.log('Отправляем на печать');

      // Отправляем на печать
      await print(receiptHtml);

      console.log('Чек успешно напечатан');
      res.json({ success: true, message: 'Receipt printed successfully' });
    } catch (error) {
      console.error('Ошибка при загрузке HTML чека:', error.message);
      console.error('Полная ошибка:', error);
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при печати чека:', error.message);
    console.error('Полная ошибка:', error);
    res.status(500).json({ 
      error: 'Failed to print receipt',
      details: error.message 
    });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Print server is running on port ${port}`);
}); 