const path = require('path');
const { app } = require('electron');
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

let db = null;

function openDatabase(dbname) {
    const dbPath = path.join(app.getPath('userData'), dbname);
    if (!fs.existsSync(dbPath)) {
        throw new Error('Database file does not exist');
    }
    db = new DatabaseSync(dbPath);
    console.log('Database opened at', dbPath);
    return db;
}

function isDatabaseOpen() {
    return db !== null;
}

function query(sql) {
    if (!db) throw new Error('No database open');
    //console.log('requête en cours :', sql);
    const stmt = db.prepare(sql);
    return stmt.all();
}

function insert(table, params) {
    if (!db) throw new Error('No database open');
    // Construction des clauses
    const columns = Object.keys(params).join(', ');
    // Échappement des quotes simples dans les valeurs
    const values = Object.values(params)
        .map(value => `'${String(value).replace(/'/g, "''")}'`)
        .join(', ');
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
    const stmt = db.prepare(sql);
    return stmt.run();
}

function update(table, params, where) {
    if (!db) throw new Error('No database open');
    // Construction de la clause SET
    const setClause = Object.keys(params).map(col => `${col} = ?`).join(', ');
    // Construction de la clause WHERE
    const whereClause = Object.keys(where).map(col => `${col} = ?`).join(' AND ');
    // Construction du tableau de valeurs
    const values = [...Object.values(params), ...Object.values(where)];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const stmt = db.prepare(sql);
    return stmt.run(...values);
}

function deleteRow(table, where) {
    if (!db) throw new Error('No database open');
    // Construction de la clause WHERE
    const whereClause = Object.keys(where).map(col => `${col} = ?`).join(' AND ');
    // Construction du tableau de valeurs
    const values = Object.values(where);
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const stmt = db.prepare(sql);
    return stmt.run(...values);
}

function testDb(dbname) {
    let result = {
        tableCount: 0,
        msgTables: '',
        maxVDate: null,
        msgVDate: '',
        V_Tag_Exists: false,
        msgTag: '',
        globalError: '',
        success : false
    };
    try {
        openDatabase(dbname);
        const basicReq = query('SELECT name FROM sqlite_master WHERE type=\'table\'');
        if (basicReq.length >= 2) {
            result.tableCount = basicReq.length;
            lastFlightReq = query('SELECT MAX(V_date) FROM Vol');
            if (lastFlightReq.length > 0) {
                const lastFlight = lastFlightReq[0]['MAX(V_date)'];
                if (lastFlight != null && lastFlight != undefined && lastFlight.length >= 4) {
                    result.maxVDate =  lastFlight.substring(2, 4)
                    const testV_Tag = query(`SELECT * FROM sqlite_master where sql like '%V_Tag%'`)
                    if (testV_Tag.length === 0) {
                        const alterReq = query(`ALTER TABLE Vol ADD V_Tag integer`)
                        if (alterReq.length === 0) {
                            // Si la colonne est ajoutée avec succès, alterReq est un tableau vide
                            result.V_Tag_Exists = true
                            result.msgTag = 'V_Tag column added successfully'
                            // On fait l'impasse de l'ajout des valeurs par défaut 
                            // pour ne pas complexifier la migration
                            result.success = true
                        } else {
                            result.V_Tag_Exists = false
                            result.msgTag = 'Error adding V_Tag column'
                        }
                    } else {
                        result.V_Tag_Exists = true
                        result.success = true
                    }
                } else {
                    result.maxVDate = null
                    result.msgVDate = 'No valid date found in database'
                }
            } else {
                result.maxVDate = ''
                result.msgVDate = 'No flights in database'
            }
        } else {
            result.tableCount = basicReq.length
            result.msgTables = 'Insufficient tables in database'
        }
    } catch (error) {
        result.globalError = 'Error in testDb : '+dbname+' '+error.message
    }

    return result
}

module.exports = {
    openDatabase,
    isDatabaseOpen,
    query,
    insert,
    update,
    deleteRow,
    testDb
};