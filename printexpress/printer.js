const os = require('os');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const pdfPrinter = require('pdf-to-printer');

class PrinterService {
  constructor() {
    this.platform = os.platform();
    this.printerName = process.env.PRINTER_NAME || '';
    this.tempDir = path.join(__dirname, 'temp');
    
    // Создаем временную директорию, если её нет
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async print(html) {
    try {
      const timestamp = Date.now();
      const tempHtmlPath = path.join(this.tempDir, `receipt_${timestamp}.html`);
      const tempPdfPath = path.join(this.tempDir, `receipt_${timestamp}.html.pdf`);

      // Сохраняем HTML во временный файл
      await fs.promises.writeFile(tempHtmlPath, html, 'utf8');

      // Конвертируем HTML в PDF с помощью puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html);
      await page.pdf({
        path: tempPdfPath,
        format: 'A7',
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm'
        }
      });
      await browser.close();

      // Отправляем PDF на печать в зависимости от ОС
      await this.printPdfByPlatform(tempPdfPath);

      // Очищаем временные файлы
      this.cleanupTempFiles(tempHtmlPath, tempPdfPath);

      return { success: true };
    } catch (error) {
      console.error('Error printing:', error);
      throw error;
    }
  }

  async printPdfByPlatform(pdfPath) {
    switch (this.platform) {
      case 'win32':
        await this.printWindows(pdfPath);
        break;
      case 'darwin':
        await this.printMacOS(pdfPath);
        break;
      case 'linux':
        await this.printLinux(pdfPath);
        break;
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  async printWindows(pdfPath) {
    try {
      const options = this.printerName ? { printer: this.printerName } : {};
      await pdfPrinter.print(pdfPath, options);
    } catch (error) {
      console.error('Error printing on Windows:', error);
      // Пробуем запасной вариант с SumatraPDF
      const command = this.printerName
        ? `SumatraPDF.exe -print-to "${this.printerName}" "${pdfPath}"`
        : `SumatraPDF.exe -print-dialog "${pdfPath}"`;

      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            console.error('Error printing with SumatraPDF:', error);
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }

  async printMacOS(pdfPath) {
    const command = this.printerName
      ? `lpr -P "${this.printerName}" "${pdfPath}"`
      : `lpr "${pdfPath}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          console.error('Error printing on macOS:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async printLinux(pdfPath) {
    const command = this.printerName
      ? `lp -d "${this.printerName}" "${pdfPath}"`
      : `lp "${pdfPath}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          console.error('Error printing on Linux:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  cleanupTempFiles(...files) {
    files.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlink(file, (err) => {
          if (err) console.error(`Error deleting temp file ${file}:`, err);
        });
      }
    });
  }
}

module.exports = {
  print: async (html) => {
    const printer = new PrinterService();
    return printer.print(html);
  }
}; 