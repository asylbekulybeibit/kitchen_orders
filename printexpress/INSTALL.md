# Установка сервиса печати

## Windows

1. Установите Node.js (версия 16 или выше)
2. Установите SumatraPDF:
   - Скачайте с официального сайта: https://www.sumatrapdfreader.org/download-free-pdf-viewer
   - Добавьте путь к SumatraPDF в переменную PATH
3. Установите зависимости:
```bash
npm install
```

## macOS

1. Установите Node.js (версия 16 или выше)
2. Установите CUPS (если не установлен):
```bash
brew install cups
```
3. Установите зависимости:
```bash
npm install
```

## Linux (Ubuntu/Debian)

1. Установите Node.js (версия 16 или выше)
2. Установите CUPS и утилиты печати:
```bash
sudo apt-get update
sudo apt-get install cups cups-client
```
3. Установите зависимости:
```bash
npm install
```

## Настройка

1. Создайте файл `.env` на основе `.env.example`
2. Укажите имя принтера в переменной `PRINTER_NAME`

### Получение имени принтера

#### Windows
```bash
wmic printer get name
```

#### macOS
```bash
lpstat -p
```

#### Linux
```bash
lpstat -p -d
```

## Проверка установки

1. Запустите сервер:
```bash
npm start
```

2. Отправьте тестовый запрос:
```bash
curl -X POST http://localhost:3001/print \
  -H "Content-Type: application/json" \
  -d '{"receiptUrl": "http://localhost:3000/receipts/test.html"}'
``` 