const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),

  langmsg: () => ipcRenderer.invoke('lang:msg'),

  getStartStatus: () => ipcRenderer.invoke('getStartStatus'),

  invoke: (params) => {
      const channel = params.invoketype
      const args = params.args 
      return ipcRenderer.invoke(channel, args);
  },

  quitApp: () => ipcRenderer.send("app:quit"),
});

