// Génère le menu dropdown des scores
export function generateScoreMenu(gettext, runXcScoreCallback) {
    const scores = [
        'FFVL',
        'XContest',
        'FAI',
        'FAI-Cylinders',
        'FAI-OAR',
        'FAI-OAR2',
        'XCLeague'
    ];

    setTimeout(() => {
        const menu = document.getElementById('score-dropdown-menu');
        if (menu) {
            scores.forEach(league => {
                const link = menu.querySelector(`[data-league="${league}"]`);
                if (link) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        runXcScoreCallback(league);
                    });
                }
            });
        }
    }, 0);

    return /*html*/ `
<div style="font-weight:bold; color:#1976d2; font-size:1.15em; padding:8px 16px 4px 16px;">
    ${gettext('Choose a league')}
</div>
<ul style="list-style:none; margin:0; padding:0;">
    ${scores.map(score => `
    <li style="padding:8px 16px;">
        <a href="#" data-league="${score}" style="color:#1976d2; text-decoration:none; font-size:1.1em; display:block;">
            ${score}
        </a>
    </li>
    `).join('')}
</ul>
`;
}

// Génère la table de score
export function generateScoreTable(gettext, league, textColor, geojson) {
    const result = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
    const scoreLegs = result.legs;
    const legsRows = scoreLegs && scoreLegs.length > 0 ? scoreLegs.map((leg, i) => `
<tr>
    <td style="font-weight:bold;">${leg.name ?? `TP${i+1}`}${leg.next ? ' : ' + leg.next : ''}</td>
    <td id="sc-legd${i+1}">${leg.d ?? ''} km</td>
</tr>
`).join('') : '';
    return /*html*/ `
<table style="width:100%; border-collapse:collapse; font-size:1.08em;">
    <tr style="background:${textColor}">
        <td style="font-weight:bold;">${league ?? ''}</td>
        <td></td>
    </tr>
    <tr style="background:#eaeaea;">
        <td style="font-weight:bold;">${gettext('Best possible')}</td>
        <td id="sc-best">${result.score ?? ''} pts</td>
    </tr>
    <tr>
        <td style="font-weight:bold;">${result.course ?? ''}</td>
        <td id="sc-course">${result.distance ?? ''} km</td>
    </tr>
    <tr style="background:#eaeaea;">
        <td style="font-weight:bold;">${gettext('Multiplier')}</td>
        <td id="sc-multi">${result.multiplier ?? ''}</td>
    </tr>
    ${legsRows}
</table>
`;
}

// Génère les sections d'infos
export function generateInfoSections(gettext, feature, flightData, flightAnalyze) {
    const dateTkoff = new Date(feature.properties.coordTimes[0]) // to get local time
    // getMonth returns integer from 0(January) to 11(December)
    const dTkOff = String(dateTkoff.getDate()).padStart(2, '0') + '/' + String((dateTkoff.getMonth() + 1)).padStart(2, '0') + '/' + dateTkoff.getFullYear()
    const hTkoff = dateTkoff.getUTCHours().toString().padStart(2, '0') + ':' + dateTkoff.getUTCMinutes().toString().padStart(2, '0');
    const dateLand = new Date(feature.properties.coordTimes[feature.properties.coordTimes.length - 1])
    const hLand = dateLand.getUTCHours().toString().padStart(2, '0') + ':' + dateLand.getUTCMinutes().toString().padStart(2, '0');
    const durationFormatted = new Date(flightData.V_Track.stat.duration * 1000).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0]
    const avgTransSpeed = (Math.round(flightAnalyze?.avgTransSpeed * 100) / 100).toFixed(0)
    const avgThermalClimb = (Math.round(flightAnalyze?.avgThermalClimb * 100) / 100).toFixed(2)
    const h = Math.floor(flightAnalyze?.extractTime / 3600)
    const m = Math.floor(flightAnalyze?.extractTime % 3600 / 60)
    const s = Math.floor(flightAnalyze?.extractTime % 3600 % 60)
    const hDisplay = h > 0 ? h + (h == 1 ? "h" : "h") : ""
    const mDisplay = m > 0 ? m + (m == 1 ? "mn" : "mn") : ""
    const sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : ""
    const hExtractTime = hDisplay + mDisplay + sDisplay

    const fields = [{
            id: 'date',
            label: gettext('Date'),
            value: flightData?.V_Track?.info.date
        },
        {
            id: 'site',
            label: gettext('Site'),
            value: 'PLANFAIT FRANCE'
        },

        {
            id: 'pilot',
            label: gettext('Pilot'),
            value: flightData?.V_Track?.info.pilot
        },
        {
            id: 'glider',
            label: gettext('Glider'),
            value: flightData?.V_Track?.info.gliderType
        },

        {
            id: 'tkofftime',
            label: gettext('Take off'),
            value: hTkoff
        },
        {
            id: 'tkoffalt',
            label: gettext('GPS alt'),
            value: flightData?.V_Track?.fixes[0].gpsAltitude + ' m '
        },

        {
            id: 'landtime',
            label: gettext('Landing'),
            value: hLand
        },
        {
            id: 'tkoffalt',
            label: gettext('GPS alt'),
            value: flightData?.V_Track?.fixes[flightData?.V_Track?.fixes.length - 1].gpsAltitude + ' m '
        },

        {
            id: 'duration',
            label: gettext('Duration'),
            value: durationFormatted
        },
        {
            id: 'size',
            label: gettext('Size'),
            value: flightData.V_Track.stat.distance.toFixed(2) + ' km'
        },

        {
            id: 'maxalt',
            label: gettext('Max GPS alt'),
            value: flightData?.V_Track?.stat.maxalt.gps + ' m'
        },
        {
            id: 'minalt',
            label: gettext('Min GPS alt'),
            value: flightData?.V_Track?.stat.minialt.gps + ' m'
        },

        {
            id: 'maxclimb',
            label: gettext('Max climb'),
            value: flightData?.V_Track?.stat.maxclimb + ' m/s'
        },
        {
            id: 'maxsink',
            label: gettext('Max sink'),
            value: flightData?.V_Track?.stat.maxsink + ' m/s'
        },

        {
            id: 'maxgain',
            label: gettext('Max gain'),
            value: flightAnalyze.bestGain + ' m'
        },
        {
            id: 'maxspeed',
            label: gettext('Max speed'),
            value: flightData?.V_Track?.stat.maxspeed + ' km/h'
        },

        {
            id: 'bestglide',
            label: gettext('Best transition'),
            value: (flightAnalyze.bestGlide / 1000).toFixed(2) + ' km'
        },
        {
            id: 'empty1',
            label: '',
            value: ''
        },

        {
            id: 'avgtrans',
            label: gettext('Avg transition speed'),
            value: avgTransSpeed + ' km/h'
        },
        {
            id: 'empty2',
            label: '',
            value: ''
        },

        {
            id: 'avgthermal',
            label: gettext('Avg thermal climb'),
            value: avgThermalClimb + ' m/s'
        },
        {
            id: 'empty3',
            label: '',
            value: ''
        },

        {
            id: 'extracttime',
            label: gettext('Extraction time'),
            value: hExtractTime
        },
        {
            id: 'empty4',
            label: '',
            value: ''
        },

        {
            id: 'efficiency',
            label: gettext('Avg th efficiency'),
            value: Math.ceil(flightAnalyze?.avgThermalEffi) + ' %'
        },
        {
            id: 'empty5',
            label: '',
            value: ''
        },

    ];

    // Regroupe les champs deux par deux
    let html = '';
    for (let i = 0; i < fields.length; i += 2) {
        const f1 = fields[i];
        const f2 = fields[i + 1];
        html += `<div class="info-row" style="display: flex; justify-content: space-between; gap: 12px;">
    <span>
        <b id="label-${f1.id}">${gettext(f1.label)}${f1.label ? ' :' : ''}</b>
        <span id="value-${f1.id}" ${f1.id==='efficiency' ? ' class="efficiency-highlight"' : '' }>${f1.value ?? ''}</span>
    </span>
    ${f2 ? `<span>
        <b id="label-${f2.id}">${f2.label ? gettext(f2.label) + ' :' : ''}</b>
        <span id="value-${f2.id}" ${f2.id==='efficiency' ? ' class="efficiency-highlight"' : '' }>${f2.value ?? ''}</span>
    </span>` : ''}
    </div>`;
    }
    html += `<div style="margin:12px 0 0 0;">${generateMiniBar(gettext,flightAnalyze)}</div>`;
    return html;

}

function generateMiniBar(gettext, flightAnalyze) {
    const percThermals = Math.round(flightAnalyze?.percThermals * 100) ?? 0;
    const percGlides = Math.round(flightAnalyze?.percGlides * 100) ?? 0;
    const percDives = Math.round(flightAnalyze?.percDives * 100) ?? 0;
    const percVarious = Math.round(100 - (percThermals + percGlides + percDives));

    // Prépare les segments et légendes
    const segments = [];
    const legends = [];

    // Prépare les données
    const bars = [{
            value: percThermals,
            color: '#ffb300',
            label: gettext('Thermal')
        },
        {
            value: percGlides,
            color: '#1976d2',
            label: gettext('Glide')
        },
        ...(percDives > 0 ? [{
            value: percDives,
            color: '#c62828',
            label: gettext('Dive')
        }] : []),
        {
            value: percVarious,
            color: '#43a047',
            label: gettext('Various')
        }
    ];

    bars.forEach((bar, i) => {
        // Détermine l'arrondi
        let radius = '0';
        if (i === 0 && bars.length === 1) {
            radius = '8px';
        } else if (i === 0) {
            radius = '8px 0 0 8px';
        } else if (i === bars.length - 1) {
            radius = '0 8px 8px 0';
        }
        // Affiche la valeur seulement si le segment est assez large (>8%)
        const showValue = bar.value > 8 ? `${bar.value}%` : '';
        segments.push(`
    <div style="
                position: relative;
                display: inline-block;
                height: 36px;
                width: ${bar.value}%;
                background: ${bar.color};
                border-radius: ${radius};
                text-align: center;
                vertical-align: top;
                font-size: 1em;
                color: #fff;
                font-weight: bold;
                overflow: hidden;
            ">
        <span style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    white-space: nowrap;
                    font-size: 1em;
                    color: #fff;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.25);
                ">${showValue}</span>
    </div>
    `);
        legends.push(`<span style="color:${bar.color};">${bar.label}</span>`);
    });

    // Génère la barre et la légende
    const legend = `
    <div style="display:flex;justify-content:space-between;font-size:0.85em;margin-top:2px;">
        ${legends.join('')}
    </div>
    `;

    return `
    <div style="margin:8px 0 2px 0;">
        <div style="width:100%;background:#eee;border-radius:8px;overflow:hidden;display:flex;">
            ${segments.join('')}
        </div>
        ${legend}
    </div>
    `;
}

export function generateChronoSections(gettext, flightAnalyze) {
    let htmlText = /*html */ `
    <div>
        <table style="width:100%; border-collapse:collapse; font-size:1em;">
            <thead>
                <tr style="background:#f8f9fa;">
                    <th style="padding:8px 6px; text-align:left;">${gettext('Time')}</th>
                    <th style="padding:8px 6px; text-align:left;">${gettext('Elapsed')}</th>
                    <th style="padding:8px 6px; text-align:left;">${gettext('Alt')}</th>
                    <th style="padding:8px 6px; text-align:left;"></th>
                    <th style="padding:8px 6px; text-align:left;"></th>
                </tr>
            </thead>
            <tbody>
                `;

    let rowIndex = 0;
    for (let cr of flightAnalyze.course) {
        const bgColor = rowIndex % 2 === 0 ? '#f2f2f2' : '#fff';

        let icon = '';
        let label = '';
        let info = '';
        let link = '';
        switch (cr.category) {
            case 'K':
                icon = '<i class="bi bi-send"></i>';
                label = gettext('Take off');
                info = '';
                link = `<a href="#" class="takeoff-link" style="color:#1976d2; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                    ${icon} ${label}
                </a>`;
                break;
            case 'T':
                icon = '<i class="bi bi-cloud-arrow-up"></i>';
                label = gettext('Thermal');
                info = `[+${cr.data1}m ${(Math.round(cr.data2 * 100) / 100).toFixed(2)}m/s]`;
                link = `<a href="#" class="segment-link" data-segment='${JSON.stringify(cr.coords)}' style="color:#43a047; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                    ${icon} ${label}
                </a>`;
                break;
            case 'G':
                icon = '<i class="bi bi-arrow-right"></i>';
                label = gettext('Transition');
                info = `[+${cr.data1}km ${cr.data2}km/h]`;
                link = `<a href="#" class="segment-link" data-segment='${JSON.stringify(cr.coords)}' style="color:#ff9800; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                    ${icon} ${label}
                </a>`;
                break;
            case 'L':
                icon = '<i class="bi bi-flag"></i>';
                label = gettext('Landing');
                info = '';
                link = `<a href="#" class="landing-link" style="color:#1976d2; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                    ${icon} ${label}
                </a>`;
                break;
            default:
                label = '';
                info = '';
                link = '';
        }

        htmlText += `
                <tr style="background:${bgColor};">
                    <td style="padding:6px 4px;">${cr.time}</td>
                    <td style="padding:6px 4px;">${cr.elapsed ?? '00:00'}</td>
                    <td style="padding:6px 4px;">${cr.alt}</td>
                    <td style="padding:6px 4px;">${link}</td>
                    <td style="padding:6px 4px; color:#444;">${info}</td>
                </tr>
                `;
        rowIndex++;
    }

    htmlText += /*html */ `
            </tbody>
        </table>
    </div>
    `;
    return htmlText;
}

export function generateCutMenu(gettext) {
    return /*html */ `
    <div style="max-width:400px;">
        <div style="margin-bottom:10px; font-weight:bold; font-size:1.2em; background:#e3f2fd; border-radius:6px; padding:8px 12px; text-align:left;">
            1️⃣ ${gettext('Select the area on the chart')}<br>
            ➡️ ${gettext('Click to set the start point')}<br>
            ➡️ ${gettext('Hold until you reach the last point')}<br>
            <button id="start-cut-btn" class="btn btn-success btn-sm" type="button" style="margin-top:5px;margin-bottom:5px;text-align:center;">
                ${gettext('Start selecting')}
            </button>
        </div>
        <div style="margin-bottom:10px; font-weight:bold; font-size:1.2em; background:#e3f2fd; border-radius:6px; padding:8px 12px;text-align:left;">
            2️⃣ ${gettext('Checking on the chart')}<br>
            ➡️ ${gettext('Click to confirm cut')}<br>
            <div style="margin-top:10px;margin-bottom:5px;text-align:center;">
                <button id="cancel-cut-btn" class="btn btn-secondary btn-sm" type="button">
                    ${gettext('Cancel')}
                </button>
                <button id="confirm-cut-btn" class="btn btn-danger btn-sm" type="button" style="margin-left:12px;" disabled>
                    ${gettext('Confirm cut')}
                </button>
            </div>
        </div>

    </div>
    `;
}
export function generateOpenAipFilter(gettext) {
    return /*html */ `
    <div style="max-width:600px;">
        <div style="margin-bottom:10px; font-weight:bold; font-size:1.6em; background:#e3f2fd; border-radius:6px; padding:8px 12px; text-align:center;">
            <a href="#" id="display-link-openaip" style="color:#1976d2; text-decoration:underline;">
                <i class="bi bi-eye" style="margin-right:6px;"></i>
                ${gettext('Display airspaces')} [openAIP]
                <i class="bi bi-eye" style="margin-left:6px;"></i>
            </a>
        </div>
        <div style="margin-bottom:10px;">
            <div style="font-weight:bold; margin-bottom:6px;">${gettext('Classes')}</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <label><input type="checkbox" id="cbA" value=0 checked> A</label>
                <label><input type="checkbox" id="cbB" value=1 checked> B</label>
                <label><input type="checkbox" id="cbC" value=2 checked> C</label>
                <label><input type="checkbox" id="cbD" value=3 checked> D</label>
                <label><input type="checkbox" id="cbE" value=4 checked> E</label>
                <label><input type="checkbox" id="cbF" value=5> F</label>
                <label><input type="checkbox" id="cbG" value=6> G</label>
            </div>
        </div>
        <div style="margin-bottom:10px;">
            <div style="font-weight:bold; margin-bottom:6px;">${gettext('Types')}</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <label><input type="checkbox" id="cbPro" value=3 checked> ${gettext('Prohibited')}</label>
                <label><input type="checkbox" id="cbRes" value=1 checked> ${gettext('Restricted')}</label>
                <label><input type="checkbox" id="cbDan" value=2 checked> ${gettext('Danger')}</label>
                <label><input type="checkbox" id="cbCtr" value=4> ${gettext('CTR')}</label>
                <label><input type="checkbox" id="cbTma" value=7> ${gettext('TMA')}</label>
                <label><input type="checkbox" id="cbRmz" value=6> ${gettext('RMZ')}</label>
                <label><input type="checkbox" id="cbTmz" value=5> ${gettext('TMZ')}</label>
                <label><input type="checkbox" id="cbGli" value=21> ${gettext('Gliding')}</label>
                <label><input type="checkbox" id="cbOth" value=0> ${gettext('Other')}</label>
            </div>
        </div>
        <div style="margin-bottom:10px;">
            <div style="font-weight:bold; margin-bottom:6px;">${gettext('Floor below')}</div>
            <div style="display:flex; gap:18px; flex-wrap:wrap;">
                <label><input type="radio" name="floorBelow" id="frd5" value="500" checked> 500m</label>
                <label><input type="radio" name="floorBelow" id="frd10" value="1000"> 1000m</label>
                <label><input type="radio" name="floorBelow" id="frd20" value="2000"> 2000m</label>
                <label><input type="radio" name="floorBelow" id="frd30" value="3000"> 3000m</label>
                <label><input type="radio" name="floorBelow" id="frd40" value="4000"> 4000m</label>
                <label><input type="radio" name="floorBelow" id="frd50" value="5000"> 5000m</label>
            </div>
        </div>
        <div style="margin-bottom:18px;">
            <div style="font-weight:bold; margin-bottom:6px;">${gettext('Radius')}</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <label><input type="radio" name="bloc4radio" id="rd5" value="50" checked> 50km</label>
                <label><input type="radio" name="bloc4radio" id="rd10" value="100"> 100km</label>
                <label><input type="radio" name="bloc4radio" id="rd15" value="150"> 150km</label>
                <label><input type="radio" name="bloc4radio" id="rd20" value="200"> 200km</label>
                <label><input type="radio" name="bloc4radio" id="rd30" value="300"> 300km</label>
                <label><input type="radio" name="bloc4radio" id="rd40" value="400"> 400km</label>
                <label><input type="radio" name="bloc4radio" id="rd50" value="500"> 500km</label>
            </div>
        </div>
        <hr style="margin:18px 0; border:0; border-top:4px solid #ccc;">
        <div style="margin-bottom:10px; font-weight:bold; font-size:1.6em; background:#e3f2fd; border-radius:6px; padding:8px 12px; text-align:center; color:#1976d2;">
            <i class="bi bi-cloud-check" style="margin-right:6px;"></i>
            ${gettext('Check the track')}
        </div>
        <div style="display:flex; gap:24px; font-weight:bold; font-size:1.1em; margin-bottom:10px;">
            <a href="#" id="check-link-openaip" style="color:#1976d2; text-decoration:underline;">
                ${gettext('OpenAip source')}
            </a>
            <a href="#" id="check-link-bazile" style="color:#1976d2; text-decoration:underline;">
                ${gettext('Bazile source (fr)')}
            </a>
            <a href="#" id="check-link-file" style="color:#1976d2; text-decoration:underline;">
                ${gettext('Local file source')}
            </a>
        </div>
    </div>`;
}