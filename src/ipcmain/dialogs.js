const {ipcMain} = require('electron')
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const https = require('https');
const http = require('http');
const { type } = require('os');


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
ipcMain.handle('file:open', async (event,args) => {
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

ipcMain.handle('box:error', async (event, args) => {
    const { title, message } = args;
    dialog.showErrorBox(title || 'Error', message || 'An error has occurred.');
    return { success: true };
});

ipcMain.handle('box:confirmation', async (event, args) => {
    const { title, message, buttons = ['Oui', 'Non'], defaultId = 0, cancelId = 1 } = args;
    const result = await dialog.showMessageBox({
        type: 'question',
        title: title || 'Confirmation',
        message: message || 'Voulez-vous continuer ?',
        buttons,
        defaultId,
        cancelId,
        noLink: true
    });
    return { success: true, response: result.response };
});

//  const exportResult = ipcRenderer.sendSync('save-wpt',oziText,'ozi',filePath)
/*
* Inspiré de la sauvegarde waypoints ds L6 process-main/files-utils/open-file.js
* Sauvegarde de fichier texte (waypoints, etc.)
* args : 
        const paramsSave = {
            stringFile: stringIgc,
            typeFile: 'igc',        // ou 'igc', 'ozi', etc.
            defPath: ''             // si null la fonction utilise le dossier Documents
        };
*
* Appel : 
        const result = await window.electronAPI.invoke({
            invoketype: 'file:savetext',
            args: paramsSave
        });
        if (result.success) {
            alert('Fichier sauvegardé : ' + result.filePath);
        } else {
            alert('Erreur : ' + result.message);
        }
*/
ipcMain.handle('file:savetext', async (event, args) => {
    const { stringFile, typeFile, defPath } = args;
    let dlgTitle = 'Export';
    let dlgName;
    let dlgExt;

    switch (typeFile) {
        case 'igc':
            dlgTitle = 'Igc';
            dlgName = 'Igc format';
            dlgExt = 'igc';
            break;
        case 'ozi':
            dlgTitle = 'Ozi';
            dlgName = 'OZI format';
            dlgExt = 'wpt';
            break;
        case 'cup':
            dlgTitle = 'Cup';
            dlgName = 'CUP format';
            dlgExt = 'cup';
            break;
        case 'com':
            dlgTitle = 'CompeGps';
            dlgName = 'CompeGps format';
            dlgExt = 'wpt';
            break;
        case 'gpx':
            dlgTitle = 'Gpx';
            dlgName = 'Gpx format';
            dlgExt = 'gpx';
            break;
        case 'kml':
            dlgTitle = 'Kml';
            dlgName = 'Kml format';
            dlgExt = 'kml';
            break;
        case 'xctsk':
            dlgTitle = 'Xctsk';
            dlgName = 'XCTrack format';
            dlgExt = 'xctsk';
            break;
        case 'dump':
            dlgTitle = 'GpsDump';
            dlgName = 'GPSDump format';
            dlgExt = 'wpt';
            break;
        default:
            dlgName = 'Fichier';
            dlgExt = 'txt';
    }
    // Si defPath est null ou vide, on utilise le dossier Documents
    let finalPath = defPath;
    if (!defPath) {
        finalPath = path.join(app.getPath('documents'), `export.${dlgExt}`);
    }
    try {
        const result = await dialog.showSaveDialog({
            title: dlgTitle,
            defaultPath: finalPath,
            filters: [{
                name: dlgName,
                extensions: [dlgExt]
            }]
        });

        const filename = result.filePath;
        if (!filename) {
            return { success: false, message: 'Error : the user clicked the btn but didn\'t create a file' };
        }

        await fs.promises.writeFile(filename, stringFile);
        return { success: true, filePath: filename };
    } catch (err) {
        console.log(err);
        return { success: false, message: 'Error : ' + err.message };
    }
});