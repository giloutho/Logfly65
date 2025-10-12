const {app, ipcMain} = require('electron')
const process = require('process')
const path = require('path')
const fs = require('fs')
const log = require('electron-log')
const dbCore = require('./db-core');
const gpsDumpFiles = require('../js/gpsdump-settings.js')
const gpsDumpParams = gpsDumpFiles.getParam()
const Store = require('electron-store').default;
const store = new Store()
const specOS = store.get('specOS')

let flightList = {}

ipcMain.handle('gpsdump:list', async (event, args) => {
    const gpsModel = args.gpsModel;
    flightList = {
        manufacturer: null,
        model: null,
        serial: null,
        firmware: null,
        error: false,
        flights: [],
        otherlines:[]
    }         
    const execFileSync = require('child_process').execFileSync
    const spawn = require('child_process').spawnSync
    let gpsDumpPath
    let data
    let paramGPS
    let paramPort
    let paramList
    let paramFile
    let modelGPS = gpsModel.model  
    const wNoWin = '/win=0'  
    const wExit = '/exit'  
    const wOverw = "/overwrite"    
    if (process.env.NODE_ENV !== 'production') {
        gpsDumpPath = path.join(path.dirname(__dirname), '../bin_ext',gpsDumpParams[specOS].gpsdump);
    } else {
        gpsDumpPath = path.join(app.getAppPath(), '../bin_ext',gpsDumpParams[specOS].gpsdump);
    }
    console.log('FlightList request :'+gpsDumpPath+' for '+modelGPS+' on '+gpsModel.port);
    paramList = gpsDumpParams[specOS].list
    paramFile = gpsDumpParams[specOS].listfile
    switch (modelGPS) {
        case 'flysd':
            paramGPS = gpsDumpParams[specOS].flym      
        break      
        case 'flyold':
            paramGPS = gpsDumpParams[specOS].flymold          
        break                
        case 'fly20':
            // Compeo/Compeo+/Galileo/Competino/Flytec 5020,5030,6030
            paramGPS = gpsDumpParams[specOS].fly20              
        break      
        case 'fly15':
            // IQ-Basic / Flytec 6015
            paramGPS = gpsDumpParams[specOS].fly15                 
        break                     
    }      
    console.log('Params : '+paramGPS+' '+paramList+' '+paramFile)
    if (gpsDumpPath != null && fs.existsSync(gpsDumpPath)) { 
        try {
            switch (specOS) {
                case 'win':
                    const numPort = gpsModel.port.replace('COM','')
                    paramPort = '/com='+numPort
                    // Stein himself was surprised when I told him that notify could send to a file
                    // I found this on change log of version 5.12 
                    // Our mail exchange 08 2019
                    const wParamFile = '/notify='+paramFile
                    // L5 -> new String[]{pathGpsDump,wNoWin, wComPort, sTypeGps, sAction, sNotify, sOverw,wExit};
                    let wParam = [wNoWin, paramPort, paramGPS, paramList, wParamFile, wOverw, wExit ]
                    // Unlike the Mac and Linux versions, the Windows version does not return the list on the screen
                    // It is saved in a file whose path is in paramFile
                    log.info(path.basename(gpsDumpPath)+wParam)
                    let result = execFileSync(gpsDumpPath, wParam)
                    if(result) {
                    data = fs.readFileSync(paramFile, 'utf8')
                    }
                    break
                case 'mac32':
                    paramPort = gpsModel.port.replace('/dev/tty','-cu')
                    // in terminal ./GpsDump /gps=flymaster /name=temp.igc /flightlist
                    log.info(path.basename(gpsDumpPath)+' '+paramGPS+' '+paramPort+' '+paramList)
                    data = execFileSync(gpsDumpPath, [paramGPS,paramPort, paramList])
                    // L5 -> new String[]{pathGpsDump,sTypeGps, sAction};     
                    break            
                case 'mac64':
                    paramPort = gpsModel.port.replace('/dev/tty','-cu')
                    // in terminal :  ./GpsDumpMac64_9 -gyn -cu.usbmodem0000001 -ltempo.txt -f0  
                    log.info(path.basename(gpsDumpPath)+' '+paramGPS+' '+paramPort+' '+paramFile+' '+paramList)
                    data = execFileSync(gpsDumpPath, [paramGPS,paramPort,paramFile,paramList])
                    break
                case 'linux':
                    let subPort = "ca0";
                    if (gpsModel.port.length > 8) subPort = gpsModel.port.substring(0,9)
                    switch (subPort) {
                        case "/dev/ttyA":
                            paramPort = gpsModel.port.replace("/dev/ttyACM","-ca") 
                            break;
                        case "/dev/ttyS":
                            paramPort = gpsModel.port.replace("/dev/ttyS","-c")  
                            break;       
                        case "/dev/ttyU":
                            paramPort = gpsModel.port.replace("/dev/ttyUSB","-cu") 
                            break;                     
                        default :
                        paramPort = gpsModel.port
                        break; 
                    }                
                    log.info(path.basename(gpsDumpPath)+' '+paramGPS+' '+paramPort+' '+paramFile+' '+paramList)
                    const rawData = spawn(gpsDumpPath, [paramGPS,paramPort,paramFile,paramList])
                    // voir https://dzone.com/articles/understanding-execfile-spawn-exec-and-fork-in-node
                    data = rawData.stdout.toString()
                    break
            }
        } catch (err) {
            log.error('askFlightList error : '+err)
        }
        // data has been declared but not not necessarily initialized if the communication fails
        if (data) {
            switch (modelGPS) {
                case 'flysd':
                   await flightlistFlymaster(data,modelGPS,paramGPS,paramPort)   
                   console.log('After await flightlistFlymaster')   
                    break
                case 'flyold':
                    await flightlistFlymaster(data,modelGPS,paramGPS,paramPort)           
                    break                
                case 'fly20':
                    // For Compeo/Compeo+/Galileo/Competino/Flytec 5020,5030,6030
                    // same decoding process          
                    await flightlistFlymaster(data,modelGPS,paramGPS,paramPort)                            
                    break      
                case 'fly15':
                    switch (specOS) {
                        case 'win':
                            await flightlistFlymaster(data,modelGPS,paramGPS,paramPort)
                            break
                        case 'mac32':
                            // A vérifier
                            await flightlistFlymaster(data,modelGPS,paramGPS,paramPort)
                            break
                        case 'mac64':
                            await flightlistFlytec(data,modelGPS,paramGPS,paramPort) 
                            break
                        case 'linux':
                            flightlistFlytec(data,modelGPS,paramGPS,paramPort) 
                            break
                    }         
                    break    
            }
        } else {
            flightList.error = true
            flightList.otherlines.push('no response from GPSDump for '+gpsDumpPath)
        }
    } else {
        flightList.error = true
        flightList.otherlines.push('GPSDump not found')
        console.log('GPSDump not found')
    } 

    return flightList
})

// Flymaster and Flytec 6020/6030 decoding
// data begin with something like this
//    Product: Flymaster GpsSD  SN02988  SW2.03h
//    Track list:
//    1   23.07.20   06:08:16   01:21:57
async function flightlistFlymaster(gpsdumpOutput,gpsModel,gpsdumpGPS,gpsdumpPort) {
  try {
    let lines = gpsdumpOutput.toString().trim().split('\n')
    console.log('flightlistFlymaster called with '+lines.length+' lines')
    let typeGPS = gpsModel
    if (gpsModel == 'fly20') {
      flightList.model = 'Flytec 20/30 Compeo'
    } else {  
      flightList.model = gpsModel
    }
    let gpsdumpOrder = gpsdumpGPS+','+gpsdumpPort+','+typeGPS
    if (lines.length > 0) {
      switch (specOS) {
        case 'win':
            winDecoding(lines,gpsdumpOrder)
            break
        case 'mac32':
            mac32Decoding(lines, gpsdumpOrder)
          break            
        case 'mac64':
            mac64Decoding(lines, gpsdumpOrder)
            break
        case 'linux':
            // the screen output is the same as for the Mac version
            mac64Decoding(lines, gpsdumpOrder)
            break
      }
    }
    if (flightList.manufacturer != null) {
      if (flightList.flights.length > 0) {
        // Recherche des vols non enregistrés dans la db
        const flightListChecked = await checkFlightList(flightList);
      } else {
        flightList.error = true
        flightList.otherlines.push('No flights listed by GPSDump')         
      }
    } else {
      flightList.error = true
      flightList.otherlines.push('Unknown manufacturer') 
    }
  } catch (err) {
    log.error('flightlistFlymaster exception : '+err)
  }  
}

// Flytec 6015 decoding
// date begin with something like this
//     Line 2 6015, SW 1.3.07, S/N 1068
//     Line 3 Track list:
//     Line 4      1; 21.06.25; 14:38:50;        1; 00:17:45;  
async function flightlistFlytec(gpsdumpOutput,gpsModel,gpsdumpGPS,gpsdumpPort) {
  try {
    let lines = gpsdumpOutput.toString().trim().split('\n')
    if (lines.length > 0) {
      if (gpsModel === 'fly15') {
        // We don't decode id line -> Line 2 6015, SW 1.3.07, S/N 1068
        flightList.model = 'Flytec 6015 / Brau IQ basic'
      }
      // excellent site for regex testing : https://www.regextester.com/     
      // Ci dessous une ligne obtenue dans le terminal sous Linux avec la version 28
      //     28; 19.03.30; 09:03:04;        2; 0
      // on a enlevé le point virgule de départ pour essai concluant sous Linux
      let regexDateHours = /([^;]*);([^;]*);([^;]*);([^;]*);/
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(regexDateHours)) {
          let flDate = regexDateHours.exec(lines[i])
          let flight = {}
          // If a flight is "new", this means that it must be added to the logbook
          // By default, all the flights are to be added to the logbook.  
          // A check in the logbook is made by dblog.checkFlightList
          flight['new'] = true
          flight['date'] = flDate[2]
          flight['takeoff'] = flDate[3]
          flight['duration'] = ''  // apparemment on ne ramène plus la durée flDate[4]
          flight['gpsdump'] = gpsdumpGPS+','+gpsdumpPort+','+gpsModel
          flightList.flights.push(flight)     
        } else {
          flightList.otherlines.push('Line '+i.toString()+' '+lines[i])
        }
      }
    }
    if (flightList.flights.length > 0) {
      let flightListChecked = dblog.checkFlightList(flightList) 
      flightList = flightListChecked
    } else {
      flightList.error = true
      flightList.otherlines.push('No flights listed by GPSDump')         
    }
  } catch (err) {
    log.error('flightlistFlytec exception : '+err)
  }  
}

/**
 * excellent site for regex testing : https://www.regextester.com/
 * it displays the group by passing the cursor over the expression
 * line with product name is for Flymaster : Product: Flymaster GpsSD  SN02988  SW2.03h
 * For Flytec, it is                         Product: 6030, SN07172, SW3.38
 * regexProduct don't match for Flytec... For the time being, we do not include flytec decoding
 * By default we fill in the flightList.model field
*/

function mac64Decoding(rawLines, gpsdumpOrder) {
    console.log('mac64Decoding called')
    let regexProduct = /(Product:)[ ]{1,}(\w*)[ ]{1,}(\S*)[ ]{1,}(\S*)[ ]{1,}(\S*)/
    // line with a flight is like :  1   23.07.20   06:08:16   01:21:57
    let regexDateHours = /((\d{1,2}\.){2}\d{2}(\d{2})?)[ ]{1,}((\d{1,2}:){2}\d{2}(\d{2})?)[ ]{1,}((\d{1,2}:){2}\d{2}(\d{2})?)/
    for (let i = 0; i < rawLines.length; i++) {
        if(rawLines[i].match(regexProduct)) {
            let arrProduct = regexProduct.exec(rawLines[i])
            flightList.manufacturer = arrProduct[2]
            flightList.model = gpsModel = arrProduct[2]+' '+arrProduct[3]
            flightList.serial = arrProduct[4]
            flightList.firmware = arrProduct[5]         
        } else if (rawLines[i].match(regexDateHours)) {
            let flDate = regexDateHours.exec(rawLines[i])
            let flight = {}
            // If a flight is "new", this means that it must be added to the logbook
            // By default, all the flights are to be added to the logbook.  
            // A check in the logbook is made by dblog.checkFlightList
            flight['new'] = true
            flight['date'] = flDate[1]
            flight['takeoff'] = flDate[4]
            flight['duration'] = flDate[7]
            flight['gpsdump'] = gpsdumpOrder
            flightList.flights.push(flight)     
        } else {
          flightList.otherlines.push('Line '+i.toString()+' '+rawLines[i])
        }
  } 
}

function mac32Decoding(rawLines, gpsdumpOrder) {
  if (rawLines.length > 0) {
    // line with a flight is like : '  1 Flight date 29.07.22, time 06:00:54, duration 00:00:34'
    let regexDateHours = /Flight date ([0-9]+(\.[0-9]+)+), time ([0-9]+(:[0-9]+)+), duration ([0-9]+(:[0-9]+)+)/
    // flightList.model is already initialized with our expression (FymasterSD, FlymaterOld, etc..)
    // Decoding the line concerning the GPS characteristics is too random
    // The first lines are :
    // Port: /dev/cu.usbmodem000001
    // Trying port /dev/cu.usbmodem000001
    // Flymaster GpsSD  SN02988  SW2.03h
    for (let i = 1; i < rawLines.length; i++) {     
      if (rawLines[i].match(regexDateHours)) {
        let flDate = regexDateHours.exec(rawLines[i])
        let flight = {}
        // If a flight is "new", this means that it must be added to the logbook
        // By default, all the flights are to be added to the logbook.  
        // A check in the logbook is made by dblog.checkFlightList
        flight['new'] = true
        flight['date'] = flDate[1]
        flight['takeoff'] = flDate[3]
        flight['duration'] = flDate[5]
        flight['gpsdump'] = gpsdumpOrder
        flightList.flights.push(flight)     
      } else {
        flightList.otherlines.push('Line '+i.toString()+' '+rawLines[i])
      }
    } 
  }
}

function winDecoding(rawLines, gpsdumpOrder) {
  if (rawLines.length > 0) {
    // line with a flight is like : '2022.06.18,13:06:13,1:25:54'
    let regexDateHours = /((\d{1,2}\.){2}\d{2}(\d{2})?)[,]{1,}((\d{1,2}:){2}\d{2}(\d{2})?)[,]{1,}((\d{1,2}:){2}\d{2}(\d{2})?)/
    // flightList.model is initialized with our expression (FymasterSD, FlymaterOld, etc..)
    // No line concerning the GPS characteristics in windows list
    for (let i = 1; i < rawLines.length; i++) {     
      if (rawLines[i].match(regexDateHours)) {
        let flDate = regexDateHours.exec(rawLines[i])
        let flight = {}
        // If a flight is "new", this means that it must be added to the logbook
        // By default, all the flights are to be added to the logbook.  
        // A check in the logbook is made by dblog.checkFlightList
        flight['new'] = true
        // 2022.06.18 -> 18.06.2022
        flight['date'] = flDate[1].substring(6)+flDate[1].substring(2,6)+flDate[1].substring(0,2)
        flight['takeoff'] = flDate[4]
        flight['duration'] = flDate[7]
        flight['gpsdump'] = gpsdumpOrder
        flightList.flights.push(flight)     
      } else {
        flightList.otherlines.push('Line '+i.toString()+' '+rawLines[i])
      }
    }
  }
}

/**
 * From xLogfly V4 and new offset computation, it's not possible to compare takeoff hours
 * on GPS flight list, it's UTC time for Flymaster and local time in Flytec. Flights are stored in db in local time
 * Seach is now based on minutes of take off and flight duration... a bit far-fetched !
 */
async function checkFlightList(flightList) {  
  console.log('checkFlightList called with '+flightList.flights.length+' flights')
  let regexMinSec = /:([0-5][0-9]):([0-5][0-9])/  
  flightList.flights.forEach(flight => {
    let arrDate = flight['date'].split('.')
    if (arrDate.length === 3) {
      let strDate =  '20'+arrDate[2]+'-'+arrDate[1]+'-'+arrDate[0]
      arrTakeoff = flight['takeoff'].split(':')
      if (arrTakeoff.length === 3) {
        let takeoffMinSeconds = (parseInt(arrTakeoff[1])*60)+parseInt(arrTakeoff[2])
        arrDuration = flight['duration'].split(':')
        if (arrDuration.length > 2) {
          // this was gpsTotalSec in Rech_Vol_by_Duree of dbSearch.java 
          gpsDurationSeconds = (parseInt(arrDuration[0])*3600)+(parseInt(arrDuration[1])*60)+parseInt(arrDuration[2])
          let dateStart = strDate+' 00:00:00'
          let dateEnd = strDate+' 23:59:59'
          const reqSQL = `SELECT V_Date,V_Duree FROM Vol WHERE V_Date >= '${dateStart}' and V_Date <= '${dateEnd}'`
          const flightsOfDay = dbCore.query(reqSQL);
          for (const fl of flightsOfDay) {
            let diffSecOK 
            if (fl.V_Date.match(regexMinSec)) {
              let dbMinSec = regexMinSec.exec(fl.V_Date)
              // Minutes and seconds of takeoff time are converted to seconds
              let dbMinSeconds = (parseInt(dbMinSec[1])*60)+parseInt(dbMinSec[2])
              let diffSeconds = dbMinSeconds - takeoffMinSeconds;                
              // We can't compare LocalDateTime : in db this is local time, in GPS, this is depending of user settings -> unreliable 
              // We compute only with minute and seconds components. If hour change -> we compare 01:59 to 02:01
              // In Flytec 6015 and 6030, GPS start time displayed and track start point are not the same values. (few minutes)
              // We consider an offset of 5 mn (300 s)
              if (diffSeconds > 300) {
                diffSeconds = 3600 - diffSeconds;
                if (diffSeconds < 360)
                    diffSecOK = true;
                else
                    diffSecOK = false;
              } else {
                  diffSecOK = true;
              }
              let dbDuration = parseInt(fl.V_Duree)
              let totalSec = gpsDurationSeconds - diffSeconds
              if (Math.abs(totalSec - dbDuration) < 180 && diffSecOK) {
                flight['new'] = false
                // iteration is stopped
                break;
              }                
            }              
          }
          // database checking is complete                   
        }          
      }
    }             
  });  

}