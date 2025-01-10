const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');
const fetch = require('node-fetch');
const { exec } = require('child_process');

const app = express();
const port = 3001;

// Включаем CORS и поддержку JSON
app.use(cors());
app.use(bodyParser.json());

// Получение списка принтеров Windows
function getPrinters() {
  return new Promise((resolve, reject) => {
    exec('wmic printer get name', (error, stdout, stderr) => {
      if (error) {
        console.error('Ошибка при получении списка принтеров:', error);
        reject(error);
        return;
      }

      // Парсим вывод команды
      const printers = stdout
        .split('\n')
        .slice(1) // Пропускаем заголовок
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(name => ({
          name,
          system: os.platform()
        }));

      resolve(printers);
    });
  });
}

// Получение списка принтеров
app.get('/printers', async (req, res) => {
  try {
    const printers = await getPrinters();
    res.json({ 
      success: true,
      system: os.platform(),
      printers: printers
    });
  } catch (error) {
    console.error('Ошибка получения списка принтеров:', error);
    res.status(500).json({ 
      error: 'Не удалось получить список принтеров',
      details: error.message 
    });
  }
});

// Печать через командную строку Windows
function printFile(filePath) {
  return new Promise((resolve, reject) => {
    // Команда для печати в Windows
    const command = `start /min "" msedge --headless --disable-gpu --print-to-pdf-no-header --print-to-pdf="${filePath}.pdf" "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Ошибка при создании PDF:', error);
        reject(error);
        return;
      }

      // Ждем создания PDF
      setTimeout(() => {
        // Печатаем PDF
        const printCommand = `PDFtoPrinter.exe "${filePath}.pdf"`;
        exec(printCommand, (printError, printStdout, printStderr) => {
          if (printError) {
            console.error('Ошибка при печати:', printError);
            reject(printError);
            return;
          }
          resolve();
        });
      }, 2000);
    });
  });
}

// Печать чека
app.post('/print', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL чека не указан',
        example: {
          url: "http://localhost:3000/receipts/receipt_123.html"
        }
      });
    }

    console.log('Получен URL чека:', url);

    // Скачиваем HTML чека
    const response = await fetch(url);
    const html = await response.text();

    console.log('Получен HTML чека:', html);

    // Создаем временный файл
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `receipt_${Date.now()}.html`);
    fs.writeFileSync(tempFile, html);

    // Печатаем файл
    await printFile(tempFile);

    // Удаляем временные файлы
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFile);
        fs.unlinkSync(tempFile + '.pdf');
      } catch (e) {
        console.error('Ошибка при удалении временных файлов:', e);
      }
    }, 3000);

    res.json({ 
      success: true, 
      message: 'Чек отправлен на печать'
    });

  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: error.message
    });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`\nДоступные endpoints:`);
  console.log(`1. GET http://localhost:${port}/printers - получение списка принтеров`);
  console.log(`2. POST http://localhost:${port}/print - печать чека`);
  console.log('\nПример запроса на печать:');
  console.log({
    url: "http://localhost:3000/receipts/receipt_123.html"
  });
}); 