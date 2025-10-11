/*
    Module pour l'import d'un vol dans le carnet
    coomprenant toutes les fonctions connexes concernant le site de décollage
*/
const {ipcMain} = require('electron')
const path = require('node:path');
const fs = require('node:fs');
const log = require('electron-log/main');
const dbCore = require('./db-core.js');
const { callPgearthAPI } = require('./api-access.js');
const trigo = require('../js/trigo.js')

ipcMain.handle('add:flight', async (event, args) => {
    const flightData = args.flightData;
    const strRename = args.strRename;
    const igcText = args.flightData.IgcText;
    // Mise en forme des champs requis pour l'insertion
    const pDate = `${flightData.date} ${flightData.startTime}`;  // INSERT INTO Vol (V_Date
    const pDuree = flightData.duration;  //V_Duree
    let totalSeconds = flightData.duration
    let hours = Math.floor(totalSeconds / 3600)
    totalSeconds %= 3600
    let minutes = Math.floor(totalSeconds / 60)
    const pSduree = String(hours).padStart(2, "0")+'h'+String(minutes).padStart(2, "0")+'mn' // V_sDuree
    const pLatDeco = flightData.latitude;  // V_LatDeco 
    const pLongDeco = flightData.longitude;  // V_LongDeco
    const pAltDeco = flightData.altitude;  // V_AltDeco
    const pUTC = flightData.offsetUTC;  // UTC
    const pEngin = flightData.glider;   // V_Engin 
    let pSite = null
    let pPays = null     
    try {
        // recherche du site de décollage       
        let searchSite = await searchSiteInDb(pLatDeco, pLongDeco);
        if (searchSite != null && searchSite != '') {
            console.log(pDate,' site from db ',searchSite)
            let fullSite = searchSite.split('*')
            if (fullSite.length > 0) {
                pSite = fullSite[0]
                pPays = fullSite[1]
            } else {
                pSite = fullSite
                pPays = '***'
            }
        } else {
            // Création du site correspondant au décollage
            // provenance : Paragliding Earth ou ajout d'un site à renommer
            const dbAddSite = await addNewSite(pLatDeco, pLongDeco, pAltDeco, strRename);
            if (dbAddSite.success) {
                log.info('Flight ', pDate, ' add site with addNewSite ', dbAddSite.newFlightSite.name)
                pSite = dbAddSite.newFlightSite.name;
                pPays = dbAddSite.newFlightSite.pays;
            } else {
                log.error(`\n-> Erreur lors de l'ajout du site : ${dbAddSite.message}`);
                pSite = 'Unable to create new site';
                pPays = '***';
            }                
        }    
        // Préparartion des paramètres pour l'insertion         
        const sqltable = 'Vol';
        const sqlparams = {
            V_Date: pDate,
            V_Duree: pDuree,
            V_sDuree: pSduree,
            V_LatDeco: pLatDeco,
            V_LongDeco: pLongDeco,
            V_AltDeco: pAltDeco,
            V_Site: pSite,
            V_Pays: pPays,
            V_IGC: igcText,
            UTC: pUTC,
            V_Engin: pEngin
        }
        //console.log(`${sqlparams.V_Date} ${sqlparams.V_sDuree} ${sqlparams.V_LatDeco} ${sqlparams.V_LongDeco} ${sqlparams.UTC} ${sqlparams.V_Engin} ${sqlparams.V_Site} ${sqlparams.V_Pays}`);
        const dbAddFlight = await dbCore.insert(sqltable, sqlparams);
        if (dbAddFlight.changes === 0) {
            log.error(`Insertion error for flight : ${sqlparams.V_Date} ${sqlparams.V_sDuree} ${sqlparams.UTC} ${sqlparams.V_Site}`);
            throw new Error('Flight not inserted');
        } else {
            return { success: true, message: 'Flight added successfully' };
        }
    } catch (err) {
        const errMsg = 'Error in dbAddFlight' + ' : ' + err.message;
        return { success: false, message: errMsg };
    }
});

async function searchSiteInDb(pLat, pLong) {
    // in Logfly 5, distance mini is stored in settings but we never changed the value of 300 m
    let distMini = 300;            
    /*
    * NOTE : under our latitudes, second decimal give a search perimeter of 1,11km. 
    * third decimal, perimeter is 222 meters ...      
    */
    const arrLat = Math.ceil(pLat*1000)/1000;
    const arrLong = Math.ceil(pLong*1000)/1000;
    const sLatMin = (arrLat - 0.01).toFixed(4).toString();
    const sLatMax = (arrLat + 0.01).toFixed(4).toString();
    const sLongMin = (arrLong - 0.01).toFixed(4).toString();
    const sLongMax = (arrLong + 0.01).toFixed(4).toString();
    // In old versions, search is limited to launching sites, but this information can be absent
    // landing sites are excluded
    let selectedSite = null
    try {
        const reqSQL = `SELECT S_ID,S_Nom,S_Latitude,S_Longitude,S_Alti,S_Localite,S_Pays FROM Site WHERE S_Latitude >'${sLatMin}' AND S_Latitude < '${sLatMax}' AND S_Longitude > '${sLongMin}' AND S_Longitude < '${sLongMax}' AND S_Type <> 'A' ` 
        const surroundingSites = await dbCore.query(reqSQL);
        for (const site of surroundingSites) {
            let carnetLat = site.S_Latitude;
            let carnetLong = site.S_Longitude;
            let distSite = Math.abs(trigo.distance(pLat,pLong,carnetLat,carnetLong, "K") * 1000)   
            if (distSite < distMini)  {
                distMini = distSite;
                selectedSite = site.S_Nom+'*'+site.S_Pays;  // since V3, we add the country
            }    
        }
    } catch (err) {
        console.error('Erreur lors de l\'exécution de searchSiteInDb :', err);
    }

    return selectedSite;
}  

async function addNewSite(lat, lng, alt, strRename) {
    try {    
        const updateDate = new Date()
        const sqlDate = updateDate.getFullYear()+'-'+String((updateDate.getMonth()+1)).padStart(2, '0')+'-'+String(updateDate.getDate()).padStart(2, '0')                 
        const sqltable = 'Site';    
        let sqlparams = {
            S_CP : '***', // Code postal inconnu, à compléter par l'utilisateur
            S_Type : 'D',
            S_Maj: sqlDate
        }        
        // First we try to find the takeoff site with the API ParaglidingEarth
        const result = await callPgearth(lat, lng);    
        if (result.success) {
            // ouverrture de la base de données
            // le site est ajouté à la table Sites de la base données
            // le site est ajouté dans les caractéristiques du vol             
            sqlparams.S_Nom = result.name.toUpperCase();
            sqlparams.S_Pays = result.countryCode.toUpperCase();
            sqlparams.S_Alti = result.takeoff_altitude;
            sqlparams.S_Latitude = result.coordinates[1];
            sqlparams.S_Longitude = result.coordinates[0];                       
        } else {
            // Pas de site trouvé ou erreur retournée par l'API paraglidingEarth
            // Search index of new blank site : 
            const blanckIdx = await searchIdxBlankSite(strRename);
            sqlparams.S_Nom = blanckIdx.siteName;
            sqlparams.S_Pays = '';
            sqlparams.S_Alti = alt;
            sqlparams.S_Latitude = lat;
            sqlparams.S_Longitude = lng;  
    }
        // New site is added to the database
        // console.log('sqlparams:', sqlparams);
        const dbAddSite = await dbCore.insert(sqltable, sqlparams);
        if (dbAddSite.changes === 0) {
            throw new Error('Site not inserted');
        }
        const newFlightSite = {
            name : sqlparams.S_Nom,
            pays : sqlparams.S_Pays
        }
        return { success: true, newFlightSite};
    } catch (error) {
        console.error('Error in addNewSite :', error);
        return { success: false, message: dbAddSite.message };        
    }          
}

async function searchIdxBlankSite(strRename) {
    // The name of an unknown site is : Site No XX to rename
    // We search last index XX
    const lastStr = strRename;
    const siteArg = 'Site No%';
    let blanckIdx = {
        newSiteIdx : '',
        siteName :'Unknown site'
    }    
    const reqSQL = `SELECT Count(S_ID) as count FROM Site WHERE S_Nom LIKE '${siteArg}'`;
    const resDb = await dbCore.query(reqSQL);
    if (resDb.length === 0 || resDb[0].count === 0) {
        blanckIdx.newSiteIdx = 1;
        blanckIdx.siteName = `Site No ${blanckIdx.newSiteIdx} (${lastStr})`;
    } else  if (resDb.length > 0) {
        blanckIdx.newSiteIdx = resDb[0].count + 1;
        blanckIdx.siteName = `Site No ${blanckIdx.newSiteIdx} (${lastStr})`;
    }
    return blanckIdx        
}

async function callPgearth(lat, lng) {
    // On fait comme si on le ramenait d'un paramètrage
    let pgurl = 'https://www.paraglidingearth.com/api/geojson/getAroundLatLngSites.php?distance=1';
    pgurl += `&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    // const url = `http://www.paraglidingearth.com/api/getAroundLatLngSites.php?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&distance=5&limit=2`;
    try {
        return await callPgearthAPI(pgurl);
    } catch (err) {
        return { success: false, message: err.message };
    }
}  

async function readIGCFile(params) {
    const { filePath } = params;
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        return { success: true, data };
    } catch (error) {
        console.error(`Error reading ${filePath} : ${error.message}`);
        return { success: false, message: error.message };
    }
}