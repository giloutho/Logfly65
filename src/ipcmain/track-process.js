const {ipcMain} = require('electron');
const fs = require('node:fs');
const { IgcDecoding } = require('./igc-decoder.js');
const { IgcAnalyze } = require('./igc-analyzer');
const { getElevationData } = require('./srtm-access');

ipcMain.handle('igc:decoding', async (event, args) => {
    const { strIgc } = args;
    try {
        const result = IgcDecoding(strIgc);        
        return { success: true, data: result.data };
    } catch (error) {
        console.log('Error in igc:decoding handler:', error);
        return { success: false, message: error.message };
    }
})

ipcMain.handle('igc:analyzing', async (event, args) => {
    const { fixes } = args;
    try {
        const analysisResult = IgcAnalyze(fixes);
        if (!analysisResult.success) {
            console.log('igc:analyzing failed : ', analysisResult.message);
            return { success: false, message: analysisResult.message };
        }   
        return { success: true, anatrack: analysisResult.anaTrack };
    } catch (error) {
        console.log('Error in igc:analyzing handler:', error);
        return { success: false, message: error.message };
    }
})

ipcMain.handle('igc:elevation-data', async (event, args) => {
    const { fixes } = args;
    try {
        const elevationRequest = await getElevationData(fixes);
        if (!elevationRequest.success) {
            console.log('igc:elevation-data failed : ', elevationRequest.message);
            return { success: false, message: elevationRequest.message };
        }
        return { success: true, elevations: elevationRequest.elevations };
    } catch (error) {
        console.log('Error in igc:elevation-data handler:', error);
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