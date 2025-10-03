const {ipcMain} = require('electron')
const path = require('node:path');
const fs = require('node:fs');
const drivelist = require('drivelist')

async function listDrives() {
  const drives = await drivelist.list();
  return drives
}

ipcMain.handle('gps:usb', async (event, args) => {
  console.log('[check-usb-gps] called for '+args.typeGps)
  const typeGPS = args.typeGps 
  const result = await listDrives()
  if (typeGPS === 'listUsb') {
    // Si on demande juste la liste des disques
    if (result instanceof Array) {
      const usbDrives = result.filter(drive => drive.isUSB);
      let usbDrivesInfo = usbDrives.map(drive => ({
        description: drive.description,
        size: drive.size,
        mountpoints: drive.mountpoints      
      }))
      if (usbDrivesInfo.length > 0) {   
        return {success: true, usbDrivesInfo};
      } else {
        return {success: false, message: 'No USB drives found'};
      }
    } else {
      return {success: false, message: 'Error retrieving drives' };
    }
  } else {
    let checkResult
    if (result instanceof Array) { 
      checkResult = exploreDrives(result,typeGPS);
    } else {
      checkResult = null
    }
    return checkResult
  }

})

const gpsFolders = {
    sky3: {
        flights: 'flights',
        waypoints: 'waypoints',
        specials: ['pilot_profiles', 'flightscreens', 'vario_tones']
    },
    xct: {
        flights: 'flights',
        specials: [],
        txtPrefix: 'XC' // reconnaissance par fichier .txt commençant par XC à la racine
    },
    connect: {
        flights: 'flights',
        waypoints: 'waypoints',
        specials: ['config']
    },    

    // Exemple pour un autre GPS :
    // xyz: {
    //     flights: 'vols',
    //     specials: ['profils', 'screens']
    // }
};

function findFolderCaseInsensitive(basePath, folderName) {
    // Cherche le dossier en minuscule ou majuscule
    const lower = path.join(basePath, folderName.toLowerCase());
    const upper = path.join(basePath, folderName.toUpperCase());
    if (fs.existsSync(lower) && fs.lstatSync(lower).isDirectory()) return lower;
    if (fs.existsSync(upper) && fs.lstatSync(upper).isDirectory()) return upper;
    return null;
}

function exploreDrives(drives, typeGPS) {
    // Capacité maximale en octets (≈ 64 Go)
    const maxCapacity = 64011120640;
    // On ne garde que les disques de capacité inférieure à la limite
    const filteredDrives = drives.filter(drive => drive.isUSB && drive.size < maxCapacity);
    // ...traitement sur filteredDrives...
    // Récupère la config des dossiers pour ce type de GPS
    const folders = gpsFolders[typeGPS];
    if (!folders) {
      return { success: false, message: 'Unknown GPS' };
    }
    for (const drive of filteredDrives) {
      console.log(`Nom: ${drive.description}, Capacité: ${drive.size} octets, Chemin: ${drive.mountpoints.map(mp => mp.path).join(', ')}`);
      if (drive.mountpoints.length > 0) {
        const usbPath = drive.mountpoints[0].path
        let validFlights = false;
        let validWaypoints = false;
        let validSpecial = false;
        let resultUsb = {};
        if (typeGPS === 'xct') {
            // Recherche d'un fichier .txt commençant par XC à la racine
            console.log(`Recherche XCTracer dans le dossier : ${usbPath}`);
            const files = fs.readdirSync(usbPath);
            for (const file of files) {
                if (
                    file.toLowerCase().endsWith('.txt') &&
                    file.startsWith(folders.txtPrefix)
                ) {
                    validFlights = true;
                    resultUsb.success = true;
                    resultUsb.usbPath = usbPath;
                    resultUsb.pathFlights = usbPath;
                    break;
                }
            }
            if (validFlights) {
                console.log(`XCTracer détecté sur ${usbPath}`);
                return resultUsb;
            }
        } else {
          console.log('Verifie les dossiers pour le GPS : ' + typeGPS);
          // Vérifie flights (majuscules/minuscules)
          const flightsPath = findFolderCaseInsensitive(usbPath, folders.flights);
          if (flightsPath) {
              validFlights = true;
              resultUsb.usbPath = usbPath;
              resultUsb.pathFlights = flightsPath;
          }

          // Vérifie waypoints (majuscules/minuscules)
          const waypointsPath = findFolderCaseInsensitive(usbPath, folders.waypoints);
          if (waypointsPath) {
              validWaypoints = true;
              resultUsb.pathWaypoints = waypointsPath;
          }

          // Vérifie les dossiers spéciaux (hors waypoints)
          for (const folder of folders.specials) {
              const folderPath = path.join(usbPath, folder);
              console.log(`Recherche du dossier spécial : ${folderPath}`);
              if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
                  console.log(`Dossier spécial trouvé : ${folderPath}`);
                  validSpecial = true;
                  break;
              }
          }
        }  
        if (validFlights && validSpecial) {
            resultUsb.success = true;
            return resultUsb; // On retourne le résultat et on arrête la boucle
        }
      } 
      // else {
      //   return { success: false, message: `Error : ${error.message}` };
      // }
    }
    // Si aucun disque n'a été trouvé ou si aucun dossier valide n'a été détecté
    return { success: false, message: 'No disk or flights folder detected' };
}