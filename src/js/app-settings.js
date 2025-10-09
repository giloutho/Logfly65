const { app } = require('electron')
const path = require('path')
const fs = require('fs') 
const process = require('process')
const log = require('electron-log/main');


function checkSettings (store) {          
    try {
        // If this is the first run, there is no config.json file
        if (fs.existsSync((store.path))) {
            // Updating environment variables
            getEnv(store)
            // L6 ramenait la dernière année enregistée 
            // pour titrer l'option Synthèse -> Synthèse 24
            return true
        } else {
            // First run, create config file with default values
            iniSettings()   
            // le retour false forçait L6 à afficher la page problème 
            // pour valider les paramètres initialisés. Est ce vraiment pertinent ?
            return false         
        }        
    } catch (error) {
        log.error('Error while checking settings  '+error)
        return false  
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

module.exports = {
    checkSettings
}
