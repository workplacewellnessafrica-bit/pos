import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import net from 'net';

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
});

// ESC/POS Universal Hardware Bridge
ipcMain.handle('print-receipt-escpos', async (_, data) => {
  const { ip, port, content, openDrawer } = data;
  return new Promise((resolve, reject) => {
    try {
      // Basic network printer approach (no C++ bindings required)
      const client = new net.Socket();
      client.connect(port || 9100, ip, () => {
        // Init printer
        client.write(Buffer.from([0x1B, 0x40]));
        
        // Print text
        client.write(content);
        
        // Feed lines
        client.write(Buffer.from([0x0A, 0x0A, 0x0A]));
        
        // Kick cash drawer (Pin 2 or 5)
        if (openDrawer) {
          client.write(Buffer.from([0x1B, 0x70, 0x00, 0x32, 0xFA]));
        }
        
        // Cut paper
        client.write(Buffer.from([0x1D, 0x56, 0x41, 0x00])); 
        
        client.end();
        resolve({ success: true });
      });
      
      client.on('error', (err) => {
        reject({ success: false, error: err.message });
      });
    } catch (e: any) {
      reject({ success: false, error: e.message });
    }
  });
});

ipcMain.handle('print-receipt-html', async (_, htmlUrl) => {
  // Silent Universal OS HTML printing fallback
  const hiddenWin = new BrowserWindow({ show: false });
  await hiddenWin.loadURL(htmlUrl);
  
  hiddenWin.webContents.print({ silent: true, margins: { marginType: 'none' } }, (success, failureReason) => {
    hiddenWin.close();
  });
  return { success: true };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
