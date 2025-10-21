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

async function testDb(dbname) {
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
            const testV_Tag = query(`SELECT * FROM sqlite_master where sql like '%V_Tag%'`)
            if (testV_Tag.length === 0) {
                const alterReq = query(`ALTER TABLE Vol ADD V_Tag integer`)
                if (alterReq.length === 0) {
                    // Si la colonne est ajoutée avec succès, alterReq est un tableau vide
                    result.V_Tag_Exists = true
                    result.msgTag = 'V_Tag column added successfully'
                    // On fait l'impasse de l'ajout des valeurs par défaut 
                    // pour ne pas complexifier la migration
                } else {
                    result.V_Tag_Exists = false
                    result.msgTag = 'Error adding V_Tag column'
                }
            } else {
                result.V_Tag_Exists = true
            }
            if (result.V_Tag_Exists === true) {
                lastFlightReq = query('SELECT MAX(V_date) FROM Vol');
                if (lastFlightReq.length > 0) {
                    const lastFlight = lastFlightReq[0]['MAX(V_date)'];
                    if (lastFlight != null && lastFlight != undefined && lastFlight.length >= 4) {
                        result.maxVDate =  lastFlight.substring(2, 4)
                        result.success = true
                    } else {
                        result.maxVDate = ''
                        result.msgVDate = 'No valid date found in database'
                        result.success = true
                    }
                } else {
                    result.maxVDate = ''
                    result.msgVDate = 'No flights in database'
                    result.success = true
                }                
            }
        } else {
            result.tableCount = basicReq.length
            result.msgTables = 'Insufficient tables in database'
        }
    } catch (error) {
        result.success = false;
        result.globalError = 'Error in testDb : '+dbname+' '+error.message
    }

    return result
}

async function createDb(dbFullPath) {
    let result = {
        tableCount: 0,
        msgTables: '',
        globalError: '',
        success : false
    };    
    try {
        const db = new DatabaseSync(dbFullPath)  
        let creationVol = 'CREATE TABLE Vol (V_ID integer NOT NULL PRIMARY KEY, V_Date TimeStamp, V_Duree integer,'
        creationVol += 'V_sDuree varchar(20), V_LatDeco double, V_LongDeco double, V_AltDeco integer, '
        creationVol += 'V_Site varchar(100), V_Pays varchar(50), V_Commentaire Long Text, V_IGC Long Text, V_Photos Long Text,UTC integer, V_CFD integer,V_Engin Varchar(10), '
        creationVol += 'V_League integer, V_Score Long Text, V_Tag integer)'
        const stmtCreaVol = db.prepare(creationVol)
        const infoVol = stmtCreaVol.run()
        if (infoVol.changes == 0) {
            result.tableCount += 1
            let creationSite = 'CREATE TABLE Site(S_ID integer NOT NULL primary key,S_Nom varchar(50),S_Localite varchar(50),'
            creationSite += 'S_CP varchar(8),S_Pays varchar(50),S_Type varchar(1),S_Orientation varchar(20),S_Alti varchar(12),'
            creationSite += 'S_Latitude double,S_Longitude double,S_Commentaire Long Text,S_Maj varchar(10))'
            const stmtCreaSite = db.prepare(creationSite)
            const infoSite = stmtCreaSite.run()
            if (infoSite.changes == 0) {
                result.tableCount += 1
                let creaEquip = 'CREATE TABLE Equip (M_ID integer NOT NULL PRIMARY KEY, M_Date TimeStamp, M_Engin varchar(30),'
                creaEquip += 'M_Event varchar(30), M_Price double, M_Comment Long Text)'
                const stmtCreaEquip= db.prepare(creaEquip)
                const infoEquip = stmtCreaEquip.run()
                if (infoEquip.changes == 0) {
                    result.tableCount += 1
                    result.success = true
                } else {
                    result.success = false;
                    result.globalError = 'Logbook creation failed in Equip table creation';
            }
            } else {
                result.success = false;
                result.globalError = 'Logbook creation failed in Site table creation';
            }
        } else {
            result.success = false;
            result.globalError = 'Logbook creation failed in Vol table creation';
        }

    } catch (error) {
        result.success = false;
        result.globalError = `Logbook creation failed: ${error.message}`;
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
    testDb,
    createDb
};