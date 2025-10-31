const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const log = require('electron-log/main');
const SyncTileSet = require('srtm-elevation').SyncTileSet;


async function getElevationData(fixes) {
    const srtmPath = path.join(app.getPath('userData'), 'srtm-data');
    if (!fs.existsSync(srtmPath)) {
        try {
            fs.mkdirSync(srtmPath, { recursive: true });
        } catch (error) {
            log.error('Erreur création dossier SRTM :', error);
            return { success: false, message: 'Unable to create the SRTM folder' };
        }
    }
    let arrayElevation = [];
    const coordsArray = fixes.map(({ latitude, longitude }) => ([latitude, longitude]));
    try {
        await downloadElevation(coordsArray, srtmPath);
        coordsArray.forEach(l => {
            arrayElevation.push(Math.round(tileset.getElevation([l[0], l[1]])));
        });
        console.log('elevation data downloaded : ', arrayElevation.length + ' points altitude sol');
        return { success: true, elevations: arrayElevation };
    } catch (err) {
        console.error('Elevation data download failed:', err);
        return { success: false, message: 'Elevation data download failed' };
    }
}

function downloadElevation(locations, srtmPath) {
    return new Promise((resolve, reject) => {
        let lats = locations.map(l => l[0]);
        let lngs = locations.map(l => l[1]);
        let minLat = Math.min.apply(null, lats);
        let maxLat = Math.max.apply(null, lats);
        let minLng = Math.min.apply(null, lngs);
        let maxLng = Math.max.apply(null, lngs);
        console.log('démarrage download pour '+minLat+'-'+minLng+'  '+maxLat+'-'+maxLng)
        console.time("download");

        tileset = new SyncTileSet(srtmPath, [minLat, minLng], [maxLat, maxLng], function(err) {
            if (err) {
                reject(err);
            } else {
                console.timeEnd("download");
                resolve(true);
            }
        }, {
            username: 'logfly_user',
            password: 'Logfly22'
        });
    });
}

module.exports.getElevationData = getElevationData;