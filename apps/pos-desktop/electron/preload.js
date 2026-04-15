import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    printESCPOS: (data) => ipcRenderer.invoke('print-receipt-escpos', data),
    printHTML: (url) => ipcRenderer.invoke('print-receipt-html', url),
});
//# sourceMappingURL=preload.js.map