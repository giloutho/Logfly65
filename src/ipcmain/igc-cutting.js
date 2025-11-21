/*
*  1. Est ce que c'est issue du carnet ?
*   - oui : sauvegarde de la trace
*  2. Génration du nouveau fichier IGC
*  3. ...
*  4. ..
*/
const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function IgcCutting(oldTrack, firstIdx, lastIdx, flightID) {
    const newFixes = oldTrack.fixes.slice(firstIdx, lastIdx + 1);
    const newTrack = { ...oldTrack, fixes: newFixes };
    console.log('After igcCutting new track has ' + newTrack.fixes.length +'/'+ oldTrack.fixes.length + ' points for flight ID ' + flightID);

    // Vérification avant de continuer
    if (!newTrack.fixes || newTrack.fixes.length < 10) {
        return { success: false, message: 'The cut-out track is empty or too short' };
    }
    if (firstIdx < 0 || lastIdx >= oldTrack.fixes.length || firstIdx > lastIdx) {
        return { success: false, message: 'Invalid cutting indices' };
    }
    const header = fileHeaderEncoding(oldTrack);
    const records = recordLineEncoding(newTrack);
    const footer = fileFooterEncoding();
    const stringIgc = header + records + footer;
    //console.log('IGC Content:', stringIgc.substring(0, 100) + '...');

        // On sauvegardera pour un trace externe
        // const outputPath = path.join(app.getPath('userData'), `flight_${flightID}_cut.igc`);
        // fs.writeFileSync(outputPath, stringIgc, 'utf-8');
        // console.log('IGC file saved to ' + outputPath);
    return { success: true, igcContent: stringIgc };
}

function fileHeaderEncoding(oldTrack) {

    const isoDate = oldTrack.info.isodate;
    const dateObj = new Date(isoDate);
    const DD = String(dateObj.getUTCDate()).padStart(2, '0');
    const MM = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const YY = String(dateObj.getUTCFullYear()).slice(-2);
    const dateDdmmyy = `${DD}${MM}${YY}`; // "220322"

    let header = '';
    header += `AXLF\r\n`;
    header += `HFDTE${dateDdmmyy}\r\n`;
    header += `HFPLTPILOT:${oldTrack.info.pilot}\r\n`;
    header += `HFGTYGLIDERTYPE:${oldTrack.info.gliderType}\r\n`;
    header += `HFGIDGLIDERID:N/A\r\n`;
    header += `HODTM100GPSDATUM: WGS-84\r\n`;
    header += `HFOFS${oldTrack.info.offsetUTC}\r\n`;
    header += `HOCIDCOMPETITIONID:N/A\r\n`;
    header += `HOCCLCOMPETITION CLASS:N/A\r\n`;
    header += `HOSITSite:N/A\r\n`;
    return header;
}

function recordLineEncoding(newTrack) {
    let stringIGC = '';
    const CrLf = '\r\n';
    let nbPt = 0;
    newTrack.fixes.forEach(pt => {
        nbPt++        
        const dateObj = new Date(pt.timestamp);
        const HH = String(dateObj.getUTCHours()).padStart(2, '0');
        const MM = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const SS = String(dateObj.getUTCSeconds()).padStart(2, '0');
        const hhmmss = `${HH}${MM}${SS}`; // Exemple : "093823"
        const igcLat = Lat_Dd_IGC(pt.latitude)
        const igcLong = Long_Dd_IGC(pt.longitude)
        const intAlt = Math.ceil(pt.gpsAltitude)
        const strAlt = intAlt.toString().padStart(5, '0')
        const bRecord = 'B'+hhmmss+igcLat+igcLong+'A00000'+strAlt
        stringIGC += bRecord+CrLf   
    });
    return stringIGC;
}

function fileFooterEncoding() {
    let footer = '';
    footer += 'LXLF Logfly 6\r\n' 
    const genDate = new Date();  
    let strDate = String(genDate.getDate()).padStart(2, '0')+'-'+String((genDate.getMonth()+1)).padStart(2, '0')+'-'+genDate.getFullYear()
    let strTime = String(genDate.getHours()).padStart(2, '0')+':'+String(genDate.getMinutes()).padStart(2, '0')+':'+String(genDate.getSeconds()).padStart(2, '0')     
    footer += 'LXLF generated '+strDate+' '+strTime+'\r\n' 
    return footer;
}

function Lat_Dd_IGC(dLat)  {    
    let igcLat          
    try {
        const AbsLat = Math.abs(dLat);
        // Getting the integer portion
        const fDeg = Math.floor(AbsLat)
        const fMin = (AbsLat - fDeg)*60
        // format with 3 decimals
        const dMin = (Math.round(fMin * 1000) / 1000).toFixed(3)
        const sMin = dMin.toString()
        // console.log(fDeg.toString().padStart(2, '0')+' '+sMin.split(".")[0].padStart(2, '0')+' '+sMin.split(".")[1])
        igcLat = fDeg.toString().padStart(2, '0')+sMin.split(".")[0].padStart(2, '0')+sMin.split(".")[1]
        if (dLat < 0)
            igcLat += 'S'
        else
        igcLat += 'N'
    } catch (error) {
        igcLat = ''
    }        

    return igcLat
}

function Long_Dd_IGC(dLong)  {
    let igcLong
    try {
        const AbsLong = Math.abs(dLong);
        // En faisant un cast integer on ne garde que la partie entière
        const fDeg = Math.floor(AbsLong)
        const fMin = (AbsLong - fDeg)*60
        // format with 3 decimals
        const dMin = (Math.round(fMin * 1000) / 1000).toFixed(3)
        const sMin = dMin.toString()
        igcLong = fDeg.toString().padStart(3, '0')+sMin.split(".")[0].padStart(2, '0')+sMin.split(".")[1]
        if (dLong < 0) 
            igcLong += 'W'
        else
            igcLong += 'E'         
    } catch (error) {
        igcLong = ''
    }                

    return igcLong
}

module.exports.IgcCutting = IgcCutting;


