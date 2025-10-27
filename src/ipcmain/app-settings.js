const {ipcMain} = require('electron')
const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const log = require('electron-log/main');
const Store = require('electron-store').default;
const store = new Store();
const dbCore = require('./db-core.js');

ipcMain.handle('settings:choose', async (event, args) => {
    const choosedPath = args.filePath;
    console.log('settings:choose for : ', choosedPath)
    const dbName = path.basename(choosedPath);
    const dbPath = path.join(app.getPath('userData'), dbName);
    try {
        fs.copyFileSync(choosedPath, dbPath);
        log.info('Database file copied from '+choosedPath+' to '+dbPath);
        const dbResult = await dbCore.testDb(dbName) 
        if (dbResult.success) {
            log.info('Database '+dbName+' passed integrity test after copy.');
            store.set('dbName', dbName); 
            console.log('settings:choose store dbName set to ', dbResult.dbname);
        } else {
           // il peut y avoir trois messages possibles :
            // Nombre de tables msgTables != '' envoyer msgTables et tableCount
            // Impossible d'ajouter V_Tag V_Tag_Exists == false envoyer msgTag
            // globalError != '' envoyer globalError
            if (dbResult.msgTables && dbResult.msgTables !== '') {
                log.error('settings:choose error with'+dbName+' : '+dbResult.msgTables+' (Table count: ' + dbResult.tableCount + ')');                
            } else if (dbResult.V_Tag_Exists === false) {
                log.error('settings:choose error with'+dbName+' : '+dbResult.msgTag);
            } else if (dbResult.globalError && dbResult.globalError !== '') {
                log.error('settings:choose error with'+dbName+' : '+dbResult.globalError);
            }

            // bad database file, it's necessary to delete it
            try {
                fs.unlinkSync(dbPath);
                log.info('Corrupted database file '+dbName+' deleted from userData folder.');
            } catch (delError) {
                log.error('Error deleting corrupted database file '+dbName+' : '+delError.message);
            }

            return dbResult;
        }    
        return dbResult
    } catch (error) {
        const errMsg = 'settings:choose : Copy error from '+choosedPath+' to '+dbPath+' : '+error.message;
        log.error(errMsg)
        return { success: false, globalError: errMsg };
    }
});

ipcMain.handle('settings:create', async (event, args) => {
    const dbName = args.dbName;
    if (dbName != undefined && dbName != '') {
        try {
            const dbPath = path.join(app.getPath('userData'), dbName);
            const dbCreation = await dbCore.createDb(dbPath);
            if (dbCreation.success) {
                log.info('settings:create ['+dbName+'] created successfully.');
                const dbResult = await dbCore.testDb(dbName)
                if (dbResult.success) {
                    log.info('settings:create ['+dbName+'] passed integrity test after creation.');
                    store.set('dbName', dbName);
                    return dbResult;
                } else {
                    log.error('settings:create ['+dbName+'] failed integrity test after creation');
                    // il peut y avoir trois messages possibles voir testDb
                    if (dbResult.msgTables && dbResult.msgTables !== '') {
                        log.error('settings:create testDb ['+dbName+'] error : '+dbResult.msgTables+' (Table count: ' + dbResult.tableCount + ')');
                    } else if (dbResult.V_Tag_Exists === false) {
                        log.error('settings:create testDb ['+dbName+'] error : '+dbResult.msgTag);
                    } else if (dbResult.globalError && dbResult.globalError !== '') {
                        log.error('settings:create testDb ['+dbName+'] error : '+dbResult.globalError);
                    }
                    return dbResult;
                }    
            } else {
                log.error('settings:create ['+dbName+'] error : '+dbCreation.globalError);
                return dbCreation;
            }
        } catch (error) {
            const errMsg = 'settings:create ['+dbName+'] error : '+error.message;
            log.error(errMsg)
            return { success: false, globalError: errMsg };
        }
    }
});

ipcMain.handle('store-get-general', async (event, args) => {
    // Recherche de la liste des carnets .db dans le dossier userData
    const dbFiles = listDbFiles();
    let generalSettings = {};
    generalSettings.lang = store.get('lang') || 'en';
    generalSettings.dbName = store.get('dbName') || 'logfly';
    generalSettings.dbFiles = dbFiles;
    generalSettings.photo = store.get('photo') || 'yes';   // défaut yes
    generalSettings.start = store.get('start') || 'log';    // défaut 'log' (logbook) otherwise 'ove'
    generalSettings.fullscreen = store.get('fullscreen') || 'no'; // défaut no
    generalSettings.over = store.get('over') || 'cal';      // default 'cal' (Calendar year) otherwise 'last' (Last twelve months)
    generalSettings.map = store.get('map') || 'osm';        // default OpenStreetMap
    generalSettings.finderlat = store.get('finderlat') || 45.863;
    generalSettings.finderlong = store.get('finderlong') || 6.1725;
    return generalSettings;
});

ipcMain.handle('store-get-pilot', async (event, args) => {
    let pilotSettings = {};
    pilotSettings.name = store.get('defpilot') || '';
    pilotSettings.namepriority = store.get('priorpilot') || 0;
    pilotSettings.glider = store.get('defglider') || '';
    pilotSettings.gliderpriority = store.get('priorglider') || 0;
    pilotSettings.gps = store.get('gps') || 'none';
    pilotSettings.gpsusb = store.get('gps-usb') || '99';
    pilotSettings.league = store.get('league') || '';
    pilotSettings.newflights = store.get('gpsnewflights') || 0;
    pilotSettings.mail = store.get('pilotmail') || '';
    pilotSettings.leaguepass = store.get('league') || '';
    pilotSettings.pilotid = store.get('pilotid') || '';
    pilotSettings.pilotpass = store.get('pilotpass') || '';
    return pilotSettings;
});

ipcMain.handle('store-get-web', async (event, args) => {        
    let webSettings = {};
    webSettings.urllogfly = store.get('urllogfly') || 'https://www.logfly.org';
    webSettings.urligc =  store.get('urllogflyigc') || 'https://www.logfly.org/downloads';
    webSettings.urlflyxc =  store.get('urlvisu') || '';
    webSettings.urlairspace =  store.get('urlairspace') || '';
    webSettings.urlcontest =  store.get('urlcontest') || '';
    return webSettings;
});

ipcMain.handle('store-set-general', async (event, args) => {
    const { lang, dbName, photo, start, fullscreen, over, map, finderlat, finderlong } = args;
    store.set('lang', lang);
    store.set('dbName', dbName);
    store.set('photo', photo);
    store.set('start', start);
    store.set('fullscreen', fullscreen);
    store.set('over', over);
    store.set('map', map);
    store.set('finderlat', finderlat);
    store.set('finderlong', finderlong);
    return { success: true };
});

ipcMain.handle('store-set-pilot', async (event, args) => {
    const { name, namepriority, glider, gliderpriority, gps, gpsusb, league, newflights, mail, leaguepass, pilotid, pilotpass } = args;
    store.set('defpilot', name);
    store.set('priorpilot', namepriority);
    store.set('defglider', glider);
    store.set('priorglider', gliderpriority);
    store.set('gps', gps);
    store.set('gps-usb', gpsusb);
    store.set('league', league);
    store.set('gpsnewflights', newflights);
    store.set('pilotmail', mail);
    store.set('pilotid', pilotid);
    store.set('pilotpass', pilotpass);
    return { success: true };
});

ipcMain.handle('store-set-web', async (event, args) => {
    const { urllogfly, urligc, urlvisu, urlairspace, urlcontest } = args;
    store.set('urllogfly', urllogfly);
    store.set('urllogflyigc', urligc);
    store.set('urlvisu', urlvisu);
    store.set('urlairspace', urlairspace);
    store.set('urlcontest', urlcontest);
    return { success: true };
});

function listDbFiles() {
    const userDataPath = app.getPath('userData');
    try {
        const files = fs.readdirSync(userDataPath);
        return files.filter(file => file.endsWith('.db'));
    } catch (error) {
        log.error('Erreur lors de la lecture du dossier userData : ' + error.message);
        return [];
    }
}