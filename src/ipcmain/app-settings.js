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