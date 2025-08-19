const {ipcMain} = require('electron')
const fs = require('fs');
const path = require('path');
const process = require('process')
const { app } = require('electron');
const log = require('electron-log/main');
const { DatabaseSync } = require('node:sqlite');

let db = null;

ipcMain.handle('db:open', async (event, args) => {
    let dbPath = args.filePath;
    if (app.isPackaged) {
        log.initialize();
        // pour savoir où se trouve le fichier de log
        log.info('Log file path:', log.transports.file.getFile().path);        
        //dbPath = app.getPath('userData') + '/test.db';
        dbPath = app.getPath('documents') + '/Logfly/test.db';
       // dbPath = path.join(app.getPath('documents'), 'Logfly', 'test.db');

        log.info('=== FOR PRODUCTION DEBUG DB OPEN ===');
        log.info('Chrome : ',process.versions.chrome,' Electron : ',process.versions.electron,' Node : ',process.versions.node);
        log.info('app.getPath(\'userData\' : '+app.getPath('userData'));
        log.info('Chemin reçu:', dbPath);
        log.info('Fichier existe ?', fs.existsSync(dbPath));
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            log.info('Taille fichier:', stats.size);
            log.info('Droits:', stats.mode);
        } else {
            log.error('ERREUR: Le fichier n\'existe pas !');
        }               
    } else {
        dbPath = path.join(app.getPath('documents'), 'Logfly', 'test.db');
    }

    if (!fs.existsSync(dbPath)) {
        return { success: false, message: 'Database file does not exist' };
    }    
    try {
        log.info('About to create DatabaseSync instance...');
        db = new DatabaseSync(dbPath);
        log.info('DatabaseSync instance created successfully');
        log.info('Testing database connection...');
        const stmtVol = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        log.info('Prepare statement successful');
        const resVol = stmtVol.get('Vol')
        log.info('Query executed successfully:', resVol);
        if (resVol != undefined && resVol != null && resVol['name'] == 'Vol') {
            return { success: true, message: 'Database opened successfully' };
        } 
        return { success: false, message: 'Database is not valid' };
    } catch (error) {
        const errMsg = 'Error opening at '+dbPath+' : '+error.message
        log.error(errMsg);
        log.error('Detailed error info:');
        log.error('Error name:', error.name);
        log.error('Error message:', error.message);
        log.error('Error stack:', error.stack);
        log.error('Error code:', error.code);
        log.error('Error errno:', error.errno);        
        db = null;
        return { success: false, message: errMsg };
    }
});

// Exemple d'un handler pour exécuter une requête
// Il faudra supprimer les antislash dans la requête envoyée
// en écrivant la requête dans une chaîne entre guillemets doubles ("), 
// on peut utiliser les apostrophes simples (') sans les échapper :
// const sql = "SELECT V_ID, strftime('%d-%m-%Y',V_date) AS Day, strftime('%H:%M',V_date) AS Hour FROM Vol ORDER BY V_Date DESC";
ipcMain.handle('db:query', async (event, args) => {
    const req = args.sqlquery;
    if (!db) {
        return { success: false, message: 'No database open' };
    }
    try {
        const query = db.prepare(req);
        // Execute the prepared statement and log the result set.        
        const result = query.all();
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// Exemple d'un handler pour réaliser une insertion
ipcMain.handle('db:insert', async (event, args) => {
    if (!db) {
        return { success: false, message: 'No database open' };
    }
    try {
        // Récupération des composants de la requête
        const table = args.sqltable;
        const params = args.sqlparams;
        // Construction des clauses
        const columns = Object.keys(params).join(', ');
        // Échappement des quotes simples dans les valeurs
        const values = Object.values(params)
            .map(value => `'${String(value).replace(/'/g, "''")}'`)
            .join(', ');

        // Assemblage final de la requête
        const sqlQuery = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
        const stmt = db.prepare(sqlQuery)
        const result = stmt.run();
        // Sqlite statement.run returns an object with changes and lastInsertRowid properties
        // result = { changes: stmt.changes, lastInsertRowid: stmt.lastInsertRowid };
        if (result.changes === 0) {
            throw new Error('No rows were inserted');
        }
        // Log the result of the insertion          
        console.log('Insert result:', result);
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('db:update', async (event, args) => {
    console.log('db:update called with args:', args);
    if (!db) {
        return { success: false, message: 'No database open' };
    }
    try {
        const table = args.sqltable;
        const params = args.sqlparams; // objet {colonne: valeur}
        const where = args.sqlwhere;   // objet {colonne: valeur}
        // Construction de la clause SET
        const setClause = Object.keys(params)
            .map(col => `${col} = ?`)
            .join(', ');
        // Construction de la clause WHERE
        const whereClause = Object.keys(where)
            .map(col => `${col} = ?`)
            .join(' AND ');
        // Construction du tableau de valeurs
        const values = [...Object.values(params), ...Object.values(where)];
        // Requête SQL finale
        const sqlQuery = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        console.log('Constructed SQL update:', sqlQuery, values);
        const stmt = db.prepare(sqlQuery);
        const result = stmt.run(...values);
        if (result.changes === 0) {
            throw new Error('No rows were updated');
        }
        return { success: true, result };
    } catch (error) {
        return { success: false, message: error.message };
    }
});
