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
    console.log('requête en cours :', sql);
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

module.exports = {
    openDatabase,
    isDatabaseOpen,
    query,
    insert,
    update,
    deleteRow
};