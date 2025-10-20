const { app, dialog } = require('electron')
const path = require('path')
const fs = require('fs') 
const process = require('process')
const log = require('electron-log/main');
const dbCore = require('../ipcmain/db-core.js');

let i18n = {}
// store initialized in main.js
async function checkSettings (store, langjson) {       
    i18n = langjson
    try {
        // If this is the first run, there is no config.json file
        if (fs.existsSync((store.path))) {
            // Updating environment variables
            getEnv(store)
            const dbChecking = await checkCurrentDb(store)
            // L6 ramenait la dernière année enregistée 
            // pour titrer l'option Synthèse -> Synthèse 24
            return dbChecking
        } else {
            // First run, create config file with default values
            iniSettings()   
            // le retour false forçait L6 à afficher la page problème 
            // pour valider les paramètres initialisés. Est ce vraiment pertinent ?
            return { success: false, globalError: 'First run, config file created with default values' };
        }        
    } catch (error) {
        log.error('Error while checking settings  '+error)
        return { success: false, globalError: 'Error while checking settings: ' + error.message };
    }

}

async function checkCurrentDb(store) {
    const recDbName = store.get('dbName')
    console.log('checkCurrentDb for : ', recDbName)
    if (recDbName != undefined && recDbName != null && recDbName != '') {
        const dbResult = await checkDbFile(recDbName, store)
        if (dbResult.success) {
            console.log('checkCurrentDb dbResult : ', dbResult)
        } else {
            log.error('checkCurrentDb not good with Db : ', recDbName)
            const { tableCount, msgTables, maxVDate, msgVDate, V_Tag_Exists, msgTag, globalError } = dbResult
            log.error('checkCurrentDb errorDetails : Error=', globalError)
            log.error('checkCurrentDb errorDetails : Tables=', tableCount, msgTables)
            log.error('checkCurrentDb errorDetails : MaxVDate=', maxVDate, msgVDate)
            log.error('checkCurrentDb errorDetails : V_Tag_Exists=', V_Tag_Exists, msgTag)

        }
        return dbResult
    } else {
        log.error('checkCurrentDb error : no dbName stored in settings')
        return { success: false, globalError: 'No dbName stored in settings' };
    }
}

function getEnv(store) {    
    let currOS
    let currVersion
    let specOS
    const platform = process.platform;
    switch(platform) {
        case 'darwin': 
            currOS = 'mac'
            currVersion = process.getSystemVersion()
            if (currVersion != undefined && currVersion != null) {
              const arrVersion = currVersion.split('.')
              if (arrVersion.length == 3) { 
                if (arrVersion[0] === '10') {
                  if (arrVersion[1] < 15) {
                    specOS = 'mac32'
                  } else {
                    specOS = 'mac64'
                  }
                } else {
                    specOS = 'mac64'
                }
              } else {lace
                specOS = 'mac64'
              }
            }
            break;
        case 'linux': 
            currOS = 'linux'
            specOS = 'linux'
            currVersion = process.getSystemVersion()
            break;
        case 'win32':
            currOS = 'win'
            specOS = 'win'
            currVersion = process.getSystemVersion()
            break;    
        default: 
            currOS = 'ns'  // non supported 
            currVersion = 'ns'
    }
    store.set('currOS',currOS)
    store.set('specOS',specOS)
    store.set('osVersion',currVersion)
    store.set('chromeVersion',process.versions.chrome)
    store.set('electronVersion',process.versions.electron)
    store.set('nodeVersion',process.versions.node)
    store.set('version',app.getVersion())      
    store.set('locale',app.getLocale())
}

function iniSettings() {
    // Initialisation des paramètres par défaut
}

/* Dans L6, par défaut la db se trouve dans un sous-dossier 'Documents/Logfly'
*  Elle peut avoir été déplacée par l'utilisateur dans un autre dossier
*  Le chemin est stocké dans dbFullPath
*. L7 ne peut accéder au dossier Documents de l'utilisateur sans autorisation explicite
*  Il est donc plus simple de stocker la BDD dans le dossier userData de l'application
*  qui est accessible sans demande d'autorisation.
*  Cette fonction vérifie la présence du fichier de BDD dans le dossier userData
*  Si le fichier n'existe pas, une migration depuis l'ancien emplacement sera nécessaire
*/
async function checkDbFile(dbName, store) {
    try {
        const dbPath = path.join(app.getPath('userData'), dbName);
        if (fs.existsSync(dbPath)) {
            // ouverture de la BDD
            console.log('Database file exists at '+dbPath)
            const dbResult = dbCore.testDb(dbName)
            return dbResult
        } else {
            // Migration nécessaire
            const oldDbPath = store.get('dbFullPath')
            // Eventuellement vérifier concordance dbName et dbFullPath
            const resCopy = await copyDbFile(oldDbPath, dbPath)
            if (resCopy.success) {
                const dbResult = dbCore.testDb(dbName)           
                return dbResult
            } else {
                log.error(resCopy.globalError)
                return { success: false, globalError: resCopy.globalError };
            }
        }
    } catch (error) {
        log.error('Error while checking database file  '+error)
        return { success: false, globalError: 'Error while checking database file: ' + error.message };
    }
}

async function copyDbFile(oldDbPath, newDbPath) {
    if (oldDbPath != undefined && oldDbPath != null && oldDbPath != '') {
        if (fs.existsSync(oldDbPath)) {
            const confirmBox = await dialog.showMessageBox({
                type: 'question',
                buttons: [gettext('OK'), gettext('Cancel')],
                defaultId: 0,
                cancelId: 1,
                title: gettext('Confirmation'),
                message: gettext('Validate the migration of the logbook')
            });
            if (confirmBox.response !== 0) {
                console.log('Database migration cancelled by user');
                return { success: false, globalError: 'copyDbFile : Migration confirmation cancelled by user' };
            }
            const fileName = path.basename(newDbPath);
            const confirmMsg = gettext('Confirm copy of logbook :'+fileName)
            const buttonMsg = gettext('Select')+' '+fileName+' '+gettext('and confirm')
            const fileConfirm = await dialog.showOpenDialog({
                title: confirmMsg,
                message : confirmMsg,
                defaultPath: oldDbPath,
                buttonLabel: buttonMsg,
                properties: ['openFile'],
                filters: [{ name: 'logbook', extensions: ['db'] }]
            });
            if (fileConfirm.canceled || fileConfirm.filePaths.length === 0) {
                return { success: false, globalError: 'Database migration cancelled by user' };
            }                 
            fs.copyFileSync(fileConfirm.filePaths[0], newDbPath);
            console.log('Database file copied from '+oldDbPath+' to '+newDbPath);
            return { success: true };
        } else {
            return { success: false, globalError: 'copyDbFile : old db file does not exist at '+oldDbPath };
        }
    } else {
        return { success: false, globalError: 'copyDbFile : no old database path provided' };
    }
}

function gettext(key) {
    return i18n[key] || key;
}   

module.exports = {
    checkSettings
}
