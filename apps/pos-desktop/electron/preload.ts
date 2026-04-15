import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // IPC methods for ESC/POS printing will be stubbed here later
});
