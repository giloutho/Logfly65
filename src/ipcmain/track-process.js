const {ipcMain} = require('electron');
const fs = require('node:fs');
const { IgcDecoding } = require('./igc-decoder.js');

ipcMain.handle('igc:decoding', async (event, args) => {
    const { strIgc } = args;
    try {
        const result = IgcDecoding(strIgc);
       // console.log('Retour sur igc:decoding -> ' + result.data.fixes.length + ' points');
        return { success: true, data: result.data};
    } catch (error) {
        return { success: false, message: error.message };
    }
})

ipcMain.handle('igc:reading', async (event, args) => {
    const { igcPath } = args;
    try {
        const strIgc = fs.readFileSync(igcPath, 'utf-8');
        const result = IgcDecoding(strIgc);
        console.log('Retour sur igc:decoding -> ' + result.data.fixes.length + ' points');
        return { success: true, data: result.data};
    } catch (error) {
        return { success: false, message: error.message };
    }
})