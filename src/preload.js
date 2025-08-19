const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  storeGet: (key) => ipcRenderer.invoke('electron-store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('electron-store-set', key, value),

  langmsg: () => ipcRenderer.invoke('lang:msg'),

  invoke: (params) => {
      const channel = params.invoketype
      const args = params.args 
      //console.log('invoke called with channel:', channel, 'and args:', args);
      return ipcRenderer.invoke(channel, args);
  },

  quitApp: () => ipcRenderer.send("app:quit"),
});

