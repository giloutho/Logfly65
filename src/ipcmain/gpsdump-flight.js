const {app, ipcMain} = require('electron')
const process = require('process')
const path = require('path')
const fs = require('fs')
const log = require('electron-log')
const gpsDumpFiles = require('../js/gpsdump-settings.js')
const gpsDumpParams = gpsDumpFiles.getParam()
const Store = require('electron-store').default;
const store = new Store()
const specOS = store.get('specOS')
const { IgcDecoding } = require('./igc-decoder.js');

ipcMain.handle('gpsdump:flight', async (event, args) => {
    const gpsParam = args.gpsParam
    const flightIndex = args.flightIndex
    console.log('gpsParam received : '+gpsParam+' flightIndex : '+flightIndex)
    const resIgc = await getGpsdumpFlight(gpsParam, flightIndex)
    return resIgc
})

async function getGpsdumpFlight(gpsParam, flightIndex) {
    // gpsParam contains parameters for GpsDump
    // something like -giq,-cu.usbserial-14140,FlymasterSD (First one is gps type, second serial port)
    console.log('flightIndex : '+flightIndex+' gpsParam : '+gpsParam)
    let data
    const execFileSync = require('child_process').execFileSync
    if (process.env.NODE_ENV !== 'production') {
        gpsDumpPath = path.join(path.dirname(__dirname), '../bin_ext',gpsDumpParams[specOS].gpsdump);
    } else {
        gpsDumpPath = path.join(app.getAppPath(), '../bin_ext',gpsDumpParams[specOS].gpsdump);
    }
    const tempFileName  = path.join(app.getPath('temp'), 'gpsdump.igc')
    console.log('tempFileName : '+tempFileName)
    if (fs.existsSync(tempFileName)) {
      try {
        fs.unlinkSync(tempFileName)
      } catch(err) {
        log.error('[getGpsdumpFlight] The gpsDump temporary file was not deleted : '+err)
      }
    }
    const paramFile = gpsDumpParams[specOS].temp+tempFileName
    let paramFlightIndex
    let callString
    let res = null 
    try {
      const gpsParamArray = gpsParam.split(",")
      const paramGPS = gpsParamArray[0]
      const paramPort = gpsParamArray[1]
      const gpsModel = gpsParamArray[2]
      
      const wNoWin = '/win=0'  
      const wExit = '/exit'  
      switch (gpsModel) {
        case 'flysd':
          // e.g. -f4
          flightIndex +=1          
          paramFlightIndex = gpsDumpParams[specOS].track+flightIndex.toString()
          break
        case 'flyold':
          if (specOS != 'win') {
            flightIndex +=1
          }
          paramFlightIndex = gpsDumpParams[specOS].track+flightIndex.toString()         
          break                
        case 'fly20':
          if (specOS != 'win') {
            flightIndex +=1
          }
          paramFlightIndex = gpsDumpParams[specOS].track+flightIndex.toString()                              
          break      
        case 'fly15':
          if (specOS != 'win') {
            flightIndex +=1
          }
          console.log('flightIndex in Flytec15 : '+flightIndex)
          paramFlightIndex = gpsDumpParams[specOS].track+flightIndex.toString()               
          break    
      }
      switch (specOS) {
        case 'win':            
            callString = path.basename(gpsDumpPath)+' '+wNoWin+' '+paramPort+' '+paramGPS+' '+paramFile+' '+paramFlightIndex+' '+wExit
            console.log(callString)
            data = execFileSync(gpsDumpPath, [wNoWin, paramPort, paramGPS, paramFile, paramFlightIndex, wExit ])
            // L5 -> new String[]{pathGpsDump,wNoWin,wComPort,sTypeGps, logIGC, numberIGC, wExit};
            break
        case 'mac32':
          callString = path.basename(gpsDumpPath)+' '+paramGPS+' '+paramFile+' '+paramFlightIndex
          console.log(callString)
          data = execFileSync(gpsDumpPath, [paramGPS,paramFile, paramFlightIndex])
          // L5 -> new String[]{pathGpsDump,sTypeGps, name32IGC, numberIGC}; 
          break            
        case 'mac64':
            callString = path.basename(gpsDumpPath)+' '+paramGPS+' '+paramPort+' '+paramFile+' '+paramFlightIndex
            console.log(callString)
            data = execFileSync(gpsDumpPath, [paramGPS,paramPort,paramFile,paramFlightIndex])
            // L5 -> new String[]{pathGpsDump,sTypeGps, macPort, name64IGC, numberIGC};
            break
        case 'linux':
            callString = path.basename(gpsDumpPath)+' '+paramGPS+' '+paramPort+' '+paramFile+' '+paramFlightIndex
            console.log(callString)
            data = execFileSync(gpsDumpPath, [paramGPS,paramPort,paramFile,paramFlightIndex])
            // L5 -> new String[]{pathGpsDump,sTypeGps, linuxPort, tempIGC, numberIGC};
            break
      }
      // data has been declared but not not necessarily initialized if the communication fails
      if (data) {
          console.log('GpsDump call ok')
          const flightDecoding = await validIgc(tempFileName)
          if (!flightDecoding.success) {
            const errMsg = 'getGpsdumpFlight decoding : '+flightDecoding.message
            log.error(errMsg)
            return { success: false, message: errMsg };            
          } 
          console.log('Flight decoded : '+flightDecoding.flightData.date+' '+flightDecoding.flightData.startTime+' duration '+flightDecoding.flightData.duration+'s'  ) 
          // Suppression du fichier temporaire
          try {
            fs.unlinkSync(tempFileName)
          } catch(err) {
            log.error('[getGpsdumpFlight] The gpsDump temporary file was not deleted : '+err)
          }          
          return { success: true, flightData: flightDecoding.flightData };
      }
    } catch (error) {
      const errMsg = 'getGpsdumpFlight : '+error.message      
      log.error(errMsg)
      return { success: false, message: errMsg };
    }
  }

  async function validIgc(tempFileName) {
    // lecture du fichier IGC 
    flightData = {}
    const igcText = await fs.promises.readFile(tempFileName, 'utf-8');
    if (!igcText) { return { success: false, message: 'File not found or empty' }; }
    // Decodage de la trace
    try {
        console.log('Appel de igc:decoding');
        const result = IgcDecoding(igcText);
        console.log('Retour sur igc:decoding -> ' + result.data.fixes.length + ' points');
        if (result.data.fixes.length > 2) {
          flightData.IgcText = igcText
          flightData.altitude = result.data.fixes[0].gpsAltitude
          flightData.latitude = result.data.fixes[0].latitude
          flightData.longitude = result.data.fixes[0].longitude
          console.log('First point : lat '+flightData.latitude+' lon '+flightData.longitude+' alt '+flightData.altitude)
          flightData.pilot = result.data.info.pilot
          flightData.glider = result.data.info.gliderType
          flightData.offsetUTC = result.data.info.offsetUTC  // in minutes
          console.log('Pilot '+flightData.pilot+' glider '+flightData.glider+' offsetUTC '+flightData.offsetUTC)
          /**
           * IMPORTANT : when a date oject is requested from the timestamp, 
           * the time difference is returned with the local configuration of the computer. 
           * So if I take a flight from Argentina in January it will return UTC+1, in July UTC+2.
           * it's necessary to request an UTC date object 
           */
          // offsetUTC is in minutes, original timestamp in milliseconds
          const startLocalTimestamp = result.data.fixes[0].timestamp + (flightData.offsetUTC*60000)
          const isoLocalStart = new Date(startLocalTimestamp).toISOString()
          const dateLocal = new Date(isoLocalStart.slice(0, -1))
          const dateStart = dateLocal
          console.log('Local start : '+dateLocal.toISOString()+' offsetUTC '+flightData.offsetUTC)
          // format must be -> YYYY-MM-DD          
          flightData.date = dateLocal.getFullYear()+'-'+String((dateLocal.getMonth()+1)).padStart(2, '0')+'-'+String(dateLocal.getDate()).padStart(2, '0')
          flightData.startTime = String(dateLocal.getHours()).padStart(2, '0')+':'+String(dateLocal.getMinutes()).padStart(2, '0')+':'+String(dateLocal.getSeconds()).padStart(2, '0')  
          console.log('Flight date '+flightData.date+' startTime '+flightData.startTime)
          const isoLocalEnd = new Date(result.data.fixes[result.data.fixes.length - 1].timestamp+(flightData.offsetUTC*60000)).toISOString()
          const dateEnd = new Date(isoLocalEnd.slice(0, -1))
          flightData.duration = (dateEnd.getTime() - dateStart.getTime()) / 1000
          console.log('validIgc success '+flightData.IgcText.length+' bytes '+flightData.date+' '+flightData.startTime+' duration '+flightData.duration+'s')
          return { success: true, flightData: flightData };
        } 
    } catch (error) {
        return { success: false, message: error.message };
    }    

      return { success: true, data: igcText };
  }