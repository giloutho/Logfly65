const {ipcMain} = require('electron')
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');


/* 
* La fonction appelante devra passer un objet args comportant à minima
*    properties: ['openfile'],
*    title: 'Sélectionner un fichier db',
*    filters: [
*        { name: 'Tous les fichiers db', extensions: ['db'] }
*    ]
* Dans la fonction handle, il faut déstructurer args pour passer  
* chaque propriété (comme filters, title, etc.) directement à showOpenDialog :
*/
ipcMain.handle('dialog:openfile', async (event,args) => {
    const result = await dialog.showOpenDialog({
        ...args
    });
    
    return result;
});

ipcMain.handle('file:read', async (event, args) => {
    const { fileName } = args;
    const filePath =path.join(app.getPath("documents"), 'Logfly', fileName);
    const result = await fs.promises.readFile(filePath, 'utf-8');
    if (!result) {
        return { success: false, message: 'File not found or empty' };
    }
    return { success: true, data: result };
});