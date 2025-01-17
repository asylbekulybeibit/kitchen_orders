const os = require('os');
const { exec } = require('child_process');

const platform = os.platform();
console.log(`Checking system requirements for ${platform}...`);

function checkWindows() {
  exec('where SumatraPDF.exe', (error) => {
    if (error) {
      console.warn('\x1b[33m%s\x1b[0m', 'WARNING: SumatraPDF not found in PATH');
      console.log('Please install SumatraPDF from https://www.sumatrapdfreader.org/download-free-pdf-viewer');
      console.log('And add it to your system PATH');
    } else {
      console.log('\x1b[32m%s\x1b[0m', 'SumatraPDF found in PATH');
    }
  });
}

function checkUnix(command, name) {
  exec(`which ${command}`, (error) => {
    if (error) {
      console.warn('\x1b[33m%s\x1b[0m', `WARNING: ${name} not found`);
      if (platform === 'darwin') {
        console.log('Please install CUPS using: brew install cups');
      } else {
        console.log('Please install CUPS using: sudo apt-get install cups cups-client');
      }
    } else {
      console.log('\x1b[32m%s\x1b[0m', `${name} found`);
    }
  });
}

switch (platform) {
  case 'win32':
    checkWindows();
    break;
  case 'darwin':
    checkUnix('lpr', 'CUPS (lpr)');
    break;
  case 'linux':
    checkUnix('lp', 'CUPS (lp)');
    break;
  default:
    console.warn('\x1b[33m%s\x1b[0m', `WARNING: Platform ${platform} is not officially supported`);
}

// Проверяем наличие .env файла
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('\x1b[32m%s\x1b[0m', '.env file created from .env.example');
  } else {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: .env.example not found');
  }
} 