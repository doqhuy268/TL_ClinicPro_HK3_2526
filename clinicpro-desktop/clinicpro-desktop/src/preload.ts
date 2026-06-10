// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('kiosk', {
  printOrSaveTicket: async (html: string): Promise<void> => {
    await ipcRenderer.invoke('kiosk:print-or-save', { html });
  },
});
