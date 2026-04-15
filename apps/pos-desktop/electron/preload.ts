import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  printESCPOS: (data: any) => ipcRenderer.invoke('print-receipt-escpos', data),
  printHTML: (url: string) => ipcRenderer.invoke('print-receipt-html', url),
});
