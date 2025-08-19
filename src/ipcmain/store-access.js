const { ipcMain } = require('electron');
const Store = require('electron-store').default;
const store = new Store();

console.log('store-access.js chargé');

ipcMain.handle('electron-store-get', (event, key) => {
    // Pour lire depuis le renderer const dbPath = await window.electronAPI.storeGet('pathdb');
    return store.get(key);
});

ipcMain.handle('electron-store-set', (event, key, value) => {
    // Pour écrire depuis le renderer await window.electronAPI.storeSet('pathdb', '/Users/gil/Documents/Logfly');
    store.set(key, value);
    return true;
});