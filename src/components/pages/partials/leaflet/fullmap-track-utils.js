export function thermalIcon(feature, latlng) {
    const isBest = feature.properties.best_thermal === true || feature.properties.best_thermal === 1 || feature.properties.best_thermal === 'true';
    const color = isBest ? 'cyan' : 'blue';
    const iconName = isBest ? 'bi-hand-thumbs-up' : 'bi-cloud-arrow-up';
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        ">
            <i class="bi ${iconName}" style="font-size: 1.5em; color: white;"></i>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    return L.marker(latlng, { icon: customIcon });
}

export function glideIcon(feature, latlng) {
    const isRight = feature.properties.glideToRight === true || feature.properties.glideToRight === 1 || feature.properties.glideToRight === 'true';
    const color = isRight ? 'purple' : 'orange';
    const iconName = isRight ? 'bi-arrow-right' : 'bi-arrow-left';
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        ">          
            <i class="bi ${iconName}" style="font-size: 1.2em; color: white;"></i>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
    return L.marker(latlng, { icon: customIcon });
}

export function getLeagueColor(selLeague) {
    let selColor
    // 33 à la fin pour ajouter de la transparence
    switch (selLeague) {
        case 'FFVL':
            selColor = { namedColor: 'yellow', hexaColor: '#FFFF0033' };
            break;
        case 'XContest':
            selColor = { namedColor: 'fuchsia', hexaColor: '#FF00FF33' };
            break;
        case 'FAI':
            selColor = { namedColor: 'darkorange', hexaColor: '#FF8C0033' };
            break;  
        case 'FAI-Cylinders':
            selColor = { namedColor: 'skyblue', hexaColor: '#87CEEB33' };
            break;
        case 'FAI-OAR':
            selColor = { namedColor: 'yellowgreen', hexaColor: '#9BCD9B33' };
            break;
        case 'FAI-OAR2':
            selColor = { namedColor: 'sienna', hexaColor: '#A0522D33' };
            break;
        case 'XCLeague' :
            selColor = { namedColor: 'lawngreen', hexaColor: '#7CFC0033' };
            break;
        default:
            selColor = { namedColor: 'yellow', hexaColor: '#FFFF0033' };
            break;
    }
    return selColor
}    

export function styleAip(feature) {
  return{      
    fillColor: feature.properties.Color,
    fillOpacity: 0.4,
    weight: 1,
    opacity: 1,
    color: 'white'
  }
}

export function findPolygonsAtClick(openaipGroup, latlng, map) {
    const booleanPointInPolygon = turf.booleanPointInPolygon;
    const point = { type: 'Feature', geometry: { type: 'Point', coordinates: [latlng.lng, latlng.lat] } };
    let html = '';
    openaipGroup.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) {
            layer.eachLayer(subLayer => {
                if (subLayer.feature && subLayer.feature.geometry.type === 'Polygon') {
                    if (booleanPointInPolygon(point, subLayer.feature)) {
                        // Icônes Bootstrap : bi bi-cloud, bi bi-info-circle, bi bi-arrow-down, bi bi-arrow-up
                        html += `<i class="bi bi-airplane-fill"></i>&nbsp;${subLayer.feature.properties.Class}&nbsp;&nbsp;[${subLayer.feature.properties.type}]&nbsp;&nbsp;`;
                        html += `${subLayer.feature.properties.Name}<br/>`;
                        html += `<i class="bi bi-arrow-down-circle-fill"></i>&nbsp;${subLayer.feature.properties.FloorLabel} (${subLayer.feature.properties.Floor}m )&nbsp;&nbsp;&nbsp;`;
                        html += `<i class="bi bi-arrow-up-circle-fill"></i>&nbsp;${subLayer.feature.properties.CeilingLabel} (${subLayer.feature.properties.Ceiling}m )<br/><br/>`;
                    }
                }
            });
        }
    });
    if (html !== '') {
        map.openPopup(html, latlng, {
            offset: L.point(0, -24)
        });
    }
}

export function styleAirsp(feature){
  return{      
      fillColor: getColorAirsp(feature.properties.Cat),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.4
  }
}

function getColorAirsp(a){
  return  a>22 ? '#999999':   
          a>21 ? '#999999':
          a>20 ? '#FFCC00':
          a>19 ? '#5B900A':
          a>18 ? '#00FF00':
          a>17 ? '#66CCFF':
          a>16 ? '#FF9999':            
          a>15 ? '#FF00FF':
          a>14 ? '#000000':
          a>13 ? '#9999CC':
          a>12 ? '#99FFFF':
          a>11 ? '#FFFF00':
          a>10 ? '#19BFBF':   
          a>9 ? '#7FBC58':
          a>8 ? '#A47A11':
          a>7 ? '#900A68':
          a>6 ? '#4B0A90':
          a>5 ? '#FFCCCC':
          a>4 ? '#FF0000':            
          a>3 ? '#0000FF':
          a>2 ? '#1971BF':
          a>1 ? '#FFCCCC':
          a>0 ? '#FE9A2E':                                                 
          '#9999CC' 
}