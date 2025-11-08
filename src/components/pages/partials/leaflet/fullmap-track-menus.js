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
    // ...reprends ici la logique de ta méthode generateInfoSections...
    // Tu peux copier/coller le code de la méthode et remplacer les accès à this.gettext, this._feature, etc.
    // par les paramètres passés à la fonction.
}