const {ipcMain} = require('electron')
const configkey  = require ('../../config/config.js')
const turfCenter = require('@turf/center').default
const turfHelper = require('@turf/helpers')
const turfIntersect = require('@turf/boolean-intersects').default
const turfWithin = require('@turf/points-within-polygon').default
const METER_PER_FEET = 0.3048

ipcMain.handle('openaip:display', async (event, args) => {
    const filter = args.filter;
    const filterValues = args.values
    const feature = args.feature;
    const result = await downloadAirspaces(filterValues, feature)
    if (result.success) {   
        console.log('downloaded ',result.airspaces.length,' airspaces from openAIP')
        const processed = await processDecoding(result.airspaces,filter,filterValues)
        console.log('return success ',processed.success, ' length ',processed.geojson.length)
        return processed
    } else {
        return result
    }
})

async function downloadAirspaces(filterValues, feature) {
    console.log('downloadAirspaces request ',filterValues)
    const openAipKey = configkey.access.openaip;
    let openAip_Url
    const airspaces = []
    let delayMs = 10
    let page = 1
    let totalPages = 1
    if (filterValues.radius == 0) {
        const bbox = feature.properties.bbox
        // Pour une vérification on ne prends pas la classe E qui est un cas vraiment particulier 
        // si on la garde on sort de fausses violations
        // par exmemple  LTA FRANCE 3 ALPES 7 ARAVIS est classée E à partir de 3000 pieds
        // bien qu'elle soit de type 'CTA' c'est une LTA donc autorisée sans radio
        const icaoFilter = filterValues.classes   
        openAip_Url = `https://api.core.openaip.net/api/airspaces?page=${page}&limit=1000&bbox=${bbox}&icaoClass=${icaoFilter}&apiKey=${openAipKey}`
    } else {
        const geoCenter = turfCenter(feature)
        const center = geoCenter.geometry.coordinates[1]+','+geoCenter.geometry.coordinates[0]
        const distance = filterValues.radius
        const icaoFilter = filterValues.classes     // [0,1,2,3,4]   // F = 5   G = 6
        openAip_Url = `https://api.core.openaip.net/api/airspaces?page=${page}&limit=1000&pos=${center}&dist=${distance}&icaoClass=${icaoFilter}&apiKey=${openAipKey}`
        console.log(openAip_Url)
    }
    try {
        while (page <= totalPages) {
            const response = await fetch(openAip_Url);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            if (response.ok) {
            const info = await response.json();
            totalPages = info.totalPages;
            airspaces.push(...info.items);
            page++;
            delayMs = 10;
            } else {
            delayMs *= 2;
            console.error(`HTTP status ${response.status}`);
            }
        }
        return { success: true, airspaces };
    } catch (e) {
        return { success: false, message: 'Error when downloading openAIP airspaces ' + e.message };
    }
}

async function processDecoding(openAipArray,filter,filterValues) {
    try {
        const promiseArray = []
        for (const item of openAipArray) {
            promiseArray.push(processItem(item))
        }
        const result = await Promise.all(promiseArray)
        let finalResult
        if (filter) {
            finalResult = result.filter((item) => filterAip(item,filterValues.types))
        } else {
            finalResult = [...result]
        }
        let totalGeoJson =[]
        for (let i = 0; i < finalResult.length; i++) {
            const el = finalResult[i]
            if (el.floorM < filterValues.floor) {
                // les coordonnées sont un double tableau...
                // je ne sais pas pourquoi mais si on fait simple tableau -> erreur
                let arrCoord = []
                arrCoord.push(el.polygon)
                // Problème des parcs comme celui des Bauges
                // le fait que ce soit une hauteur sol n'est pas clairement défini
                // Floor -> 0m Ceiling 300m donc chaque point sera forcément valide
                // Par déduction on a supposé que quand réferenceDatum était Gnd pour Floor et Ceiling
                // il s'agissait d'une hauteur sol mais rien en permet de vraiment valider
                let AltLimitTopAGL 
                if (el.floorRefGnd == 'Gnd' && el.topRefGnd == 'Gnd') {        
                    AltLimitTopAGL = true
                } else {
                    AltLimitTopAGL = false
                }
                let aipGeojson = {
                    type :"Feature",
                    properties : {
                        type : el.type,
                        Class : el.icaoClass,
                        Name : el.name,
                        id : el.id,
                        Comment : "",
                        Floor : el.floorM,
                        FloorLabel : el.floorLabel+' '+el.floorRefGnd,
                        Ceiling : el.topM,
                        CeilingLabel : el.topLabel+' '+el.topRefGnd,   
                        AltLimit_Top_AGL :  AltLimitTopAGL,             
                        AltLimit_Bottom_AGL : false, 
                        Color : getColor(el)       
                    },
                    geometry : {
                        type : "Polygon",
                        coordinates : arrCoord
                    } 
                }
                totalGeoJson.push(aipGeojson)
            }
        }    
        return { success: true, geojson: totalGeoJson };
    } catch (e) {
        return { success: false, message: 'Error during airspaces decoding: ' + e.message };
    }
}

const Unit = {
  Meter : 0,
  Feet : 1,
  FlightLevel : 6
}

const Datum = {
    Gnd : 0,
    Msl : 1,
    Std : 2
}

function toClass(key) {
    switch (key) {
        case 0 :
            return 'A'
            break
        case 1 :
            return 'B'
            break
        case 2 :
            return 'C'
            break
        case 3 :
            return 'D'
            break
        case 4 :
            return 'E'
            break
        case 5 :
            return 'F'
            break
        case 6 :
            return 'G'
            break
        case 8 :
            return 'SUA'     // Special Use Airspace
            break
        default:
            return ''
            break
    }
  }

//https://groups.google.com/g/openaip/c/-qssLEXOMi0/m/ITTRFrGLAAAJ
function toType(key) {
    switch (key) {
        case 0 :
            return 'Other'
            break
        case 1 :
            return 'Restricted'
            break
        case 2 :
            return 'Danger'
            break
        case 3 :
            return 'Prohibited'
            break
        case 4 :
            return 'CTR'                // Controlled Tower Region 
            break
        case 5 :
            return 'TMZ'                // Transponder Mandatory Zone
            break
        case 6 :
            return 'RMZ'                // Radio Mandatory Zone 
            break
        case 7 :
            return 'TMA'                // Terminal Maneuvering Area
            break
        case 8 :
            return 'TRA'                 // Temporary Reserved Area 
            break
        case 9 :
            return 'TSA'                 // Temporary Segregated Area
            break
        case 10 :
            return 'FIR'                 // Flight Information Region 
            break
        case 11 :
            return 'UIR'                   // Upper Flight Information Region
            break
        case 12 :
            return 'ADIZ'               // Air Defense Identification Zone
            break
        case 13 :
            return 'ATZ'                // Airport Traffic Zone
            break
        case 14 :
            return 'MATZ'               // Military Airport Traffic Zone
            break
        case 15 :
            return 'Airway'
            break
        case 16 :
            return 'MTR'                // Military Training Route
            break
        case 17 :
            return 'AlertArea'
            break
        case 18 :
            return 'WarningArea'
            break
        case 19 :
            return 'ProtectedArea'
            break
        case 20 :
            return 'HTZ'                 // Helicopter Traffic Zone
            break
        case 21 :
            return 'GlidingSector'  
            break
        case 22 :
            return 'TRP'                // Transponder Setting 
            break
        case 23 :
            return 'TIZ'                // Traffic Information Zone
            break
        case 24 :
            return 'TIA'                // Traffic Information Area
            break
        case 25 :
            return 'MTA'                // Military Training Area 
            break
        case 26 :
            return 'CTA'                //  Controlled Area 
            break
        case 27 :
            return 'ACC'                // Air Control Center
            break
        case 28 :
            return 'RecreationalActivity'   // Aerial Sporting Or Recreational Activity
            break
        case 29 :
            return 'LowAltitudeOverflightRestriction'
            break
        case 30 :
            return 'MRT'                // Military route training ? une ref est MTR -> Military training route
            break
        case 31 :
            return 'TFR'                //  Temporary Flight Restrictions (Notam)
            break
        case 32 :
            return 'VFRSector'
            break
        case 33 :
            return 'FISSector'              // Flight Information sector
            break
        default:
            return ''
            break
    }
 }

function toMeter(limit) {
    switch (limit.unit) {
      case Unit.Meter:
        return limit.value
      case Unit.FlightLevel:
        return 100 * METER_PER_FEET * limit.value
      case Unit.Feet:
        return METER_PER_FEET * limit.value
      default:
        throw new Error(`Invalid unit (${limit.unit})`)
    }
}

function getLabel(limit) {
    if (limit.referenceDatum == Datum.Gnd && limit.value == 0) {
        return 'GND'
    }
  
    let label = String(Math.round(limit.value))
  
    switch (limit.unit) {
      case Unit.Meter:
        label += 'm'
        break
      case Unit.Feet:
        label += 'ft'
        break
      case Unit.FlightLevel:
        return `FL ${Math.round(limit.value)}`
      default:
        throw new Error(`Invalid unit (${limit.unit})`)
    }
  
    switch (limit.referenceDatum) {
        case Datum.Gnd:
            label += ' GND'
            break
          case Datum.Msl:
            label += ' MSL'
            break
          case Datum.Std:
            label += ' STD'
            break
          default:
            throw new Error(`Invalid datum (${limit.referenceDatum})`)
    }
  
    return label
}

function toDatum(referenceDatum) {
    switch (referenceDatum) {
        case 0 :
            return 'Gnd'            
        case Datum.Msl:
            return 'Msl'
        case Datum.Std:
            return 'Std'
        default:
            return ''
    }
}

function roundCoords(coords) {
    const numDigits = 6
    const multiplier = 10 ** numDigits
    return coords.map(([lon, lat]) => [Math.round(lon * multiplier) / multiplier, Math.round(lat * multiplier) / multiplier])
}

function processItem(item) {
    return new Promise((resolve, reject) => {
        let myair = {
            name : item.name,
            id : item._id,
            country: item.country,
            typeRef : item.type,
            type: toType(item.type),
            icaoClass: toClass(item.icaoClass),
            activity: item.activity,
            floorM: Math.round(toMeter(item.lowerLimit)),
            floorLabel: getLabel(item.lowerLimit),
            floorRefGnd: toDatum(item.lowerLimit.referenceDatum),
            topM: Math.round(toMeter(item.upperLimit)),
            topLabel: getLabel(item.upperLimit),
            topRefGnd: toDatum(item.upperLimit.referenceDatum),
            polygon: roundCoords(item.geometry.coordinates[0])
        }      
        resolve(myair)
  })
}

// For SUA, there many cases see https://en.wikipedia.org/wiki/Special_use_airspace
// With the exception of the information zones
// all areas not identified as accessible to paragliders will be displayed.

//The classes have already been filtered in the query to openAIP
// Types are in an array : 3=Prohibited, 1=Restricted, 2=Danger, 4=CTR, 7=TMA, 6=RMZ, 5=TMZ, 21=Gliding, 0=Other

function filterAip(item,arrTypes) {
  let keptItem
    console.log('filterAip : '+item.name+' '+item.icaoClass+' '+item.typeRef)
  switch (item.icaoClass) {
        case 'A' :
          keptItem = true
          break
      case 'B' :
          keptItem = true
          break
      case 'C' : 
          keptItem = true
          break
      case 'D' :
          keptItem = true
          break
      case 'E' :
          keptItem = true
          break          
      case 'SUA' :
          switch (item.typeRef) {
            case 0 :   // Other
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break
            case 1 :  // Restricted
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break
            case 2 :  // Restricted
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break 
            case 3 :  // Prohibited
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                arrTypes.forEach(x => console.log('arrTypes '+x));
                console.log('Prohibited : '+item.name+' keptItem : '+keptItem)
                break   
            case 4 :  // CTR
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break          
            case 5 :  // TMZ
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break       
            case 6 :  // RMZ
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break    
            case 7 :  // TMA
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break                                                                       
            case 10: 
                keptItem = false
                break
            case 11 :
                keptItem = false
                break
            case 19 :
                keptItem = true      // ProtectedArea
                break                  
            case 21 :  // Gliding                        
                arrTypes.includes(item.typeRef.toString()) ? keptItem = true : keptItem = false
                break                  
            case 26 :
                keptItem = true   // CTA
                break                  
            case 28 :
                keptItem = false
                break
            case 29 :
                keptItem = true   // LowAltitudeOverflightRestriction, important we always let it
                break
            case 33 :
                keptItem = false
                break
            default:
                keptItem = true
          }
          break
      default:
          keptItem = false
          break
  }
  if (keptItem) return item 
}

// FlyXC colour grid
function getColor(item) {
    const colProhibited = '#bf4040'
    const colRestricted = '#bfbf40'
    const colDanger = '#bf8040'
    const colOther = '#808080'    
    switch (item.icaoClass) {
        case 'A':
        case 'B':
        case 'C':
        case 'D':
        return colProhibited
        case 'E':
        case 'F':
        case 'G':
        return colRestricted
    }
      
    switch (item.type) {
        case 'CTR':
        case 'TMA':
        case 'ATZ':
        case 'CTA':
        case 'Prohibited':
        return colProhibited
        case 'RMZ':
        case 'TMZ':
        case 'GlidingSector':
        case 'Restricted':
        case 'LowAltitudeOverflightRestriction':
        return colRestricted
        case 'Danger':
        return colDanger
    }
      
    return colOther
}