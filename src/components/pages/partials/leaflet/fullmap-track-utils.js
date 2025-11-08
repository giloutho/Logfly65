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