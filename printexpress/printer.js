const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Функция для печати HTML через Edge в headless режиме
async function print(html) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `receipt_${Date.now()}.html`);
  fs.writeFileSync(tempFile, html);

  try {
    await createPdf(tempFile);
    await printPdf(tempFile + '.pdf');
    console.log('Печать завершена успешно');
  } catch (error) {
    throw new Error(`Ошибка печати: ${error.message}`);
  } finally {
    // Удаляем временные файлы
    try {
      fs.unlinkSync(tempFile);
      fs.unlinkSync(tempFile + '.pdf');
    } catch (e) {
      console.error('Ошибка при удалении временных файлов:', e);
    }
  }
}

// Создание PDF из HTML
function createPdf(filePath) {
  return new Promise((resolve, reject) => {
    const command = `start /min "" msedge --headless --disable-gpu --print-to-pdf-no-header --print-to-pdf="${filePath}.pdf" "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Ошибка создания PDF: ${error.message}`));
        return;
      }
      // Ждем создания PDF
      setTimeout(resolve, 2000);
    });
  });
}

// Печать PDF файла
function printPdf(pdfPath) {
  return new Promise((resolve, reject) => {
    const command = `PDFtoPrinter.exe "${pdfPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Ошибка печати PDF: ${error.message}`));
        return;
      }
      resolve();
    });
  });
}

// Получение списка принтеров
function getPrinters() {
  return new Promise((resolve, reject) => {
    exec('wmic printer get name', (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Ошибка получения списка принтеров: ${error.message}`));
        return;
      }

      const printers = stdout
        .split('\n')
        .slice(1)
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

module.exports = {
  print,
  getPrinters
}; 