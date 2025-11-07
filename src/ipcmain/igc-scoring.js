const { scoringRules, solver } = require('igc-xc-score')
const miniIgcPoints = 5

async function scoring(argsScoring) {
    const { date, fixes, league } = argsScoring;

    let scoringGeoJSON = {}
    try {
        const flight = {
            date: date,
            fixes: fixes
        }        
        const rule = scoringRules[league]
       // console.log('[igc-scoring.js] Scoring flight for date :', flight.date, 'with league :', league, 'with ',flight.fixes.length,' fixes')
        // noflight true pour ne pas générer la trace du vol dans le geojson
        const result = solver(flight, rule,{ noflight : true }).next().value;
        if (result.optimal) {
            const geojson = result.geojson()
            const data = JSON.parse(JSON.stringify(geojson))
            const arrData   = Object.values(data)
            if (arrData.length == 3) {        
                scoringGeoJSON.type = "FeatureCollection"
                scoringGeoJSON.name = "EPSG:3857"
                scoringGeoJSON.league = league
                scoringGeoJSON.score = arrData[1].score
                scoringGeoJSON.bound = arrData[1].bound
                scoringGeoJSON.course = result.opt.scoring.name   // Triangle FAI ou Distance libre etc...
                console.log(result.opt.scoring.name)
                scoringGeoJSON.code = arrData[1].code
                scoringGeoJSON.distance = result.scoreInfo.distance
                scoringGeoJSON.multiplier = result.opt.scoring.multiplier
                scoringGeoJSON.legs = result.scoreInfo.legs
                // All that's left to do is go through all the legs
                scoringGeoJSON.features = []
                for (let i = 0; i < arrData[2].length; i++) {
                    const element = arrData[2][i]
                    const elemType = element.geometry.type
                    const elemId = element.properties.id
                    let elemSelected = true
                    if (elemId.includes('launch')) elemSelected = false
                    if (elemId.includes('land')) elemSelected = false
                    let feature = {}
                    let properties = {}
                    let geometry = {}
                    let coord = []
                    switch (elemType) {
                        case "Point":
                            if (elemSelected) {
                                properties.id = element.properties.id 
                                properties.r = element.properties.r
                                properties.timestamp = element.properties.timestamp
                                // version locale
                                //const date = new Date(element.properties.timestamp);
                                //const hElement = date.toLocaleTimeString('fr-FR', { hour12: false });
                                const date = new Date(element.properties.timestamp);
                                const hElement = date.toISOString().slice(11, 19); // "HH:mm:ss"
                                properties.popupContent = String(element.properties.id).toUpperCase()+'</br>'+hElement
                                geometry.type = element.geometry.type
                                geometry.coordinates = [element.geometry.coordinates[0],element.geometry.coordinates[1]]
                                feature.type = "Feature"
                                feature.id = element.id
                                feature.properties = properties
                                feature.geometry = geometry
                                scoringGeoJSON.features.push(feature)
                            }
                            break;
                        case "LineString":
                            properties.id = element.properties.id 
                            properties.d = element.properties.d
                            const dist =  (Math.round(element.properties.d * 100) / 100).toFixed(2);
                            properties.popupContent = dist+' km'
                            geometry.type = element.geometry.type
                            coord.push(element.geometry.coordinates[0])
                            coord.push(element.geometry.coordinates[1])
                            geometry.coordinates = coord                 
                            feature.type = "Feature"
                            feature.id = element.id
                            feature.properties = properties
                            feature.geometry = geometry
                            scoringGeoJSON.features.push(feature)                
                        break;
                    }
                }
                return { success: true, geojson: scoringGeoJSON };
            } 
        } else {
            return { success: false, message: 'No optimal solution found for the IGC file' };
        }            
    } catch (error) {
        return { success: false, message: '[igc-scoring.js] Error while scoring the IGC file' };
    }       
}

module.exports.scoring = scoring