const {ipcMain} = require('electron')
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const https = require('https');
const http = require('http');


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
    // On déstructure les propriétés attendues dans args
    const {
        title,
        message,
        defaultFolder,
        buttonLabel,
        properties,
        filters
    } = args;
    const defaultPath = path.join(app.getPath('documents'), defaultFolder)
    // On passe chaque propriété à showOpenDialog
    const result = await dialog.showOpenDialog({
        title,
        message,
        defaultPath,
        buttonLabel,
        properties,
        filters
    });

    return result;
});

ipcMain.handle('file:readtext', async (event, args) => {
    const { filePath } = args;
    console.log('filePath reçu dans file:readtext :', filePath);
    const result = await fs.promises.readFile(filePath, 'utf-8');
    if (!result) {
        return { success: false, message: 'File not found or empty' };
    }
    return { success: true, data: result };
});

ipcMain.handle('file:download', async (event, args) => {
    const { dlUrl } = args;
    const url = dlUrl;
    const fileName = path.basename(url);
    const destPath = path.join(app.getPath('userData'), fileName);
    if (fs.existsSync(destPath)) {
        try {
            fs.unlinkSync(destPath);
        } catch (err) {
            console.error('Erreur lors de la suppression du fichier existant :', err);
        }
    }

    // Choix du module selon le protocole
    const client = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        client.get(url, response => {
            if (response.statusCode !== 200) {
                resolve({ success: false, message: `Download failed: ${response.statusCode}` });
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    resolve({ success: true, path: destPath });
                });
            });
        }).on('error', err => {
            fs.unlink(destPath, () => {});
            resolve({ success: false, message: err.message });
        });
    });
});