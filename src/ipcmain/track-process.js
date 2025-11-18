const {ipcMain} = require('electron');
const fs = require('node:fs');
const { IgcDecoding } = require('./igc-decoder.js');
const { IgcAnalyze } = require('./igc-analyzer');
const IgcScoring = require('./igc-scoring.js');
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

ipcMain.handle('igc:scoring', async (event, args) => {
  /*
    * args contiendra 
    * const date = issue de IGCparser 
    * const fixes = array fixes issu de IGCparser
    * const league = argsScoring.league
    */
    try {
        const scoringResult = await IgcScoring.scoring(args);
        if (!scoringResult.success) {
            console.log('igc:scoring failed : ', scoringResult.message);
            return { success: false, message: scoringResult.message };
        }
        return { success: true, geojson: scoringResult.geojson };
    } catch (error) {
        console.log('Error in igc:scoring handler:', error);
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

ipcMain.handle('igc:cutting', async (event, args) => {
    try {
        const { oldTrack, firstIdx, lastIdx } = args;
        console.log('Cutting track from index ', firstIdx, ' to index ', lastIdx);
        // Verifier que fisrtIdx et lastIdx sont dans les bornes du tableau
        if (firstIdx < 0 || lastIdx >= oldTrack.fixes.length || firstIdx > lastIdx) {
            console.log('Invalid indices for cutting track');
            throw new Error('Invalid indices for cutting track');
        }
        const newFixes = oldTrack.fixes.slice(firstIdx, lastIdx + 1);
        const newTrack = { ...oldTrack, fixes: newFixes };
        console.log('New track has ', newTrack.fixes.length, ' points');


        return { success: true};
    } catch (error) {
        return { success: false, message: error.message };
    }
})