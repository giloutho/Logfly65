const {ipcMain} = require('electron')
const fs = require('fs');
const path = require('path');
const process = require('process')
const { app } = require('electron');
const log = require('electron-log/main');
const dbCore = require('./db-core');

ipcMain.handle('db:open', async (event, args) => {
    const dbPath = path.join(app.getPath('userData'),args.dbname);
    try {
        dbCore.openDatabase(args.dbname);
        const stmtVol = dbCore.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='Vol'`);
        if (stmtVol.length > 0) {
            return { success: true, message: 'Database opened successfully' };
        } 
        return { success: false, message: 'Database is not valid' };
    } catch (error) {
        const errMsg = 'Error opening at '+dbPath+' : '+error.message
        log.info('db:open Chrome : ',process.versions.chrome,' Electron : ',process.versions.electron,' Node : ',process.versions.node);
        log.info('db:open app.getPath(\'userData\' : '+app.getPath('userData'));
        log.info('db:open Chemin reçu:', dbPath);
        log.info('db:open Fichier existe ?', fs.existsSync(dbPath));
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            log.info('db:open Taille fichier:', stats.size);
            log.info('db:open Droits:', stats.mode);
        } else {
            log.error('db:open ERREUR: Le fichier n\'existe pas !');
        }                      
        return { success: false, message: errMsg };
    }
});

// Exemple d'un handler pour exécuter une requête
// Il faudra supprimer les antislash dans la requête envoyée
// en écrivant la requête dans une chaîne entre guillemets doubles ("), 
// on peut utiliser les apostrophes simples (') sans les échapper :
// const sql = "SELECT V_ID, strftime('%d-%m-%Y',V_date) AS Day, strftime('%H:%M',V_date) AS Hour FROM Vol ORDER BY V_Date DESC";
ipcMain.handle('db:query', async (event, args) => {
    try {
        const result = dbCore.query(args.sqlquery);
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('db:insert', async (event, args) => {
    try {
        // Récupération des composants de la requête
        const table = args.sqltable;
        const params = args.sqlparams;
        const result = dbCore.insert(table, params);
        // Sqlite statement.run returns an object with changes and lastInsertRowid properties
        // result = { changes: stmt.changes, lastInsertRowid: stmt.lastInsertRowid };
        if (result.changes === 0) {
            throw new Error('No rows were inserted');
        }
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('db:update', async (event, args) => {
    try {
        const table = args.sqltable;
        const params = args.sqlparams; // objet {colonne: valeur}
        const where = args.sqlwhere;   // objet {colonne: valeur}        
        const result = dbCore.update(table, params, where);
        if (result.changes === 0) {
            throw new Error('No rows were updated');
        }
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('db:delete', async (event, args) => {
    try {
        const table = args.sqltable;
        const where = args.sqlwhere;   // objet {colonne: valeur}
        const result = dbCore.deleteRow(table, where);
        if (result.changes === 0) {
            throw new Error('No rows were deleted');
        }
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});