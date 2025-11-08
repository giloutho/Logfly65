import { generateScoreMenu, generateScoreTable, generateInfoSections } from './fullmap-track-menus.js';
import { getLeagueColor } from './fullmap-track-utils.js';
import * as mapUtils from './fullmap-track-map.js';

class FullmapTrack extends HTMLElement {
    constructor() {
        super();
        this._i18n = {} // initialisé par le parent
        this.fullmap = null; 
        this.measureControl = null
        this._flightData = null; 
        this._feature = null
        this._flightAnalyze = null;
        this._layercontrol = null;
        this._geojsonLayer = null;
        this._thermalLayer = null;
        this._glideLayer = null;
        this._scoreLayer = null;
        this.startMarker = null; 
        this.endMarker = null; 
        this.hoverMarker = null;
        this.uplot = null;
        this._scoreMenuState = 'menu'; // 'menu' ou 'result'
    }

    connectedCallback() {
        this.render();
        this.initMap();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = /*html */ ` 
            <style>
                :host {
                    display: block;
                    height: 100%;
                }
                #map {
                    width: 100%;
                    height: 100%;
                    min-height: 0;
                    position: relative;
                    /* Optionnel : effet de transparence général */
                    /* background: rgba(255,255,255,0.2); */
                }
                #graph-info {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 150px; /* doit correspondre à la hauteur de #graph */
                    z-index: 2000;
                    background: rgba(255, 255, 255, 0.92);
                    font-size: 1.08em;
                    font-weight: 500;
                    color: #333;
                    border-radius: 8px 8px 0 0;
                    border-bottom: 1px solid #bbb;
                    padding: 8px 18px;
                    margin: 0 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    pointer-events: none;
                    letter-spacing: 0.02em;
                    text-align: center;
                    transition: background 0.2s;
                }
                #graph {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 2000;
                    height: 150px; /* adapte selon besoin */
                    min-height: 80px;
                    max-height: 250px;
                    background: rgba(255,255,255,0.7);
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    border-top: 1px solid #ddd;
                    pointer-events: auto;
                }
                .u-legend { display: none !important; }    
                .info-section {
                    margin-bottom: 10px;
                }
                .info-section b {
                    color: #007bff;
                }
                .efficiency-highlight {
                    background: linear-gradient(90deg, #ffe0b2 0%, #fffde7 100%);
                    border-radius: 6px;
                    padding: 2px 8px;
                    font-weight: bold;
                    color: #a0522d;
                    box-shadow: 0 1px 4px rgba(160,82,45,0.08);
                }               
            </style>
            <div id="map">
                <div id="graph-info"></div>
                <div id="graph"></div>
            </div>
        `;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Segment
            const segmentLink = e.target.closest('.segment-link');
            if (segmentLink) {
                e.preventDefault();
                e.stopPropagation();
                const coords = JSON.parse(segmentLink.getAttribute('data-segment'));
                this.displaySegment(coords);
                return;
            }
            // Décollage
            const takeoffLink = e.target.closest('.takeoff-link');
            if (takeoffLink) {
                e.preventDefault();
                e.stopPropagation();
                this.displayTakeOff();
                return;
            }
            // Atterrissage
            const landingLink = e.target.closest('.landing-link');
            if (landingLink) {
                e.preventDefault();
                e.stopPropagation();
                this.displayLanding();
                return;
            }
        });
    }

    async initMap() {
        await mapUtils.initMap.call(this);
        // // Initialiser la carte en la centrant sur Genève
        // this.fullmap = L.map('map').setView([46.2044, 6.1432], 13);
        // // Ajoute le contrôle de mesure
        // if (window.measure) {
        //     this.measureControl = new window.measure();
        //     this.fullmap.addControl(this.measureControl);
        // }
        this.initFullmapModalHeader();
    }    

    async setDefaultLayer() {
        await mapUtils.setDefaultLayer.call(this);
    }

    set flightData(value) {
        this._flightData = value;
        this._feature = this._flightData.V_Track.GeoJSON.features[0];
        // flightData contient l'objet complet provenant de igc-decoder
        // {V_Track: {…}, V_Track est le résultat d'igcDecoding
        // V_LatDeco: 45.85326666666667, 
        // V_LongDeco: 6.222916666666666, 
        // V_AltDeco: 956, 
        // V_Site: 'PLANFAIT'}        
        // Ici tu peux déclencher un rendu ou une mise à jour de la carte
       // this.updateMap();
    }

    get flightData() {
        return this._flightData;
    }

    set flightAnalyze(value) {
        this._flightAnalyze = value;
        // console.log('Mise à jour de flightAnalyze dans FullmapTrack :', this._flightAnalyze.bestGain);        
        // console.log('Réception elevation dans FullmapTrack :', this._flightAnalyze.elevations.length, ' points');
        // flightAnalyze contient l'objet d'analyse du vol
        // flightData et FlightAnalyze chargés, on peut mettre à jour la carte
        this.updateMap();
        this.updateHeader();
    }

    get flightAnalyze() {
        return this._flightAnalyze;
    }   

    get i18n() {
        return this._i18n;
    }

    set i18n(value) {
        this._i18n = value;
    }

    updateMap() {
        this.setDefaultLayer();
        if (!this._flightData.V_Track.GeoJSON) return;

        this.mapLoadGeoJSON();
        this.mapLoadThermals();
        this.mapLoadGlides();
        this.mapDrawGraph(); 
        try {
            // Si la carte Leaflet est dans une modale Bootstrap (ou un élément caché),
            // Leaflet ne connaît pas la taille réelle de la carte au moment de l’appel à fitBounds.
            // Solution : this.fullmap.invalidateSize(); juste avant ou juste après fitBounds :
            this.fullmap.invalidateSize();
            this.fullmap.fitBounds(this._geojsonLayer.getBounds());
        } catch (e) {
            console.log('Error fitting bounds:', e);
        }
        this.mapUpdateControls();
    }

     mapLoadGeoJSON() {
        mapUtils.mapLoadGeoJSON.call(this);
    //     // Retire l'ancienne couche si elle existe
    //     if (this._geojsonLayer) {
    //         this.fullmap.removeLayer(this._geojsonLayer);
    //     }

    //     try {
    //         if (this._feature && this._feature.geometry && this._feature.geometry.type === 'LineString') {
    //             const coords = this._feature.geometry.coordinates;
    //             if (coords.length > 0) {
    //                 // GeoJSON: [longitude, latitude]
    //                 const firstLatLng = { lat: coords[0][1], lng: coords[0][0] };
    //                 const lastLatLng = { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] };
    //                 if (firstLatLng) {
    //                     this.startMarker = L.marker([firstLatLng.lat, firstLatLng.lng], { icon: StartIcon }).addTo(this.fullmap);
    //                 }
    //                 if (lastLatLng) {
    //                     this.endMarker = L.marker([lastLatLng.lat, lastLatLng.lng], { icon: EndIcon }).addTo(this.fullmap);
    //                 }                    
    //             }
    //         }
    //     } catch (e) {
    //         console.log('Erreur extraction points GeoJSON', e);
    //     }
    //     // Ajoute la nouvelle couche et garde la référence
    //     this._geojsonLayer = L.geoJson(this._flightData.V_Track.GeoJSON, { style: trackOptions });
    //     this._geojsonLayer.addTo(this.fullmap);
     }

    // onEachFeature: (feature, layer) => this.createPopThermal(feature, layer)
    // recours à une fonction fléchée pour garder le bon contexte de "this"
    // sinon la fonction gettext ne fonctionne pas dans le callback onEachFeature
    mapLoadThermals() {
        mapUtils.mapLoadThermals.call(this);
    }

    mapLoadGlides() {
        mapUtils.mapLoadGlides.call(this);
    }

    mapUpdateControls() {
        mapUtils.mapUpdateControls.call(this);
    }

    mapDrawGraph() {
        const arrayAlti = this._feature['geometry']['coordinates'].map(coord => coord[2]);
        const arraySol = this._flightAnalyze && this._flightAnalyze.elevations
            ? this._flightAnalyze.elevations
            : [];
        // times contained in the GeoJSon are only strings
        // conversion to date object is necessary for Highcharts.dateFormat to work on the x axis
        const arrayHour = this._feature['properties']['coordTimes'].map(hour => new Date(hour));
        const x = arrayHour.map(date => date.getTime());
        const y1 = arrayAlti;
        // Si arraySol n'est pas de la bonne taille, on le remplit avec null ou undefined
        let y2 = [];
        if (arraySol.length === arrayAlti.length) {
            y2 = arraySol;
        } else if (arraySol.length > 0) {
            // Adapter la taille si besoin (optionnel)
            y2 = arrayAlti.map((_, i) => arraySol[i] ?? null);
        }

        const graphDiv = this.querySelector('#graph');
        if (graphDiv) {
            graphDiv.innerHTML = "";
            const options = {
                width: graphDiv.offsetWidth || 600,
                height: 150,
                series: [
                    {},
                    { label: "Altitude", stroke: "blue", width: 2 },
                    { 
                        label: "Altitude sol",
                        stroke: "Sienna",
                        width: 2,
                        fill: "rgba(160, 82, 45, 0.18)" // Remplissage sous la courbe
                    }
                ],
                axes: [
                    {
                        values: (u, ticks) => ticks.map(ts => {
                            const d = new Date(ts);
                            //return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            return d.getUTCHours().toString().padStart(2, '0') + ':' +d.getUTCMinutes().toString().padStart(2, '0');
                        }),
                      //  label: "Heure"
                    },
                    { label: "Altitude (m)" }
                ]
            };
            const data = [x, y1, y2.length ? y2 : new Array(y1.length).fill(null)];
            this.uplot = new uPlot(options, data, graphDiv);

            const graphInfoDiv = this.querySelector('#graph-info');
            if (graphInfoDiv) {
                graphInfoDiv.textContent = ''; // vide au départ
            }

            // Affichage dynamique de l'info au survol
            this.uplot.root.addEventListener('mousemove', e => {
                const idx = this.uplot.cursor.idx;
                if (idx != null && idx >= 0 && idx < x.length) {
                    const heure = arrayHour[idx];
                    const alt = y1[idx];
                    const sol = y2[idx];
                   // console.log(this._flightData.V_Track.vz[idx].toFixed(2)+'m/s  '+this._flightData.V_Track.speed[idx].toFixed(0)+' km/h')
                    graphInfoDiv.innerHTML =
                        `<span style="color:#1a6dcc;font-weight:bold;">🕒 ${heure.getUTCHours().toString().padStart(2, '0')}:${heure.getUTCMinutes().toString().padStart(2, '0')}</span>
                        &nbsp;|&nbsp;
                        <span style="color:#1976d2;">⛰️ ${alt} m</span>
                        &nbsp;|&nbsp;
                        <span style="color:Sienna;">🟫 ${sol} m</span>
                        &nbsp;|&nbsp;
                        <span style="color:#388e3c;">⬇️ ${this._flightData.V_Track.vz[idx].toFixed(2)} m/s</span>
                        &nbsp;|&nbsp;
                        <span style="color:#e65100;">➡️ ${this._flightData.V_Track.speed[idx].toFixed(0)} km/h</span>`;
                    // Récupère la position correspondante dans le GeoJSON
                    const coords = this._feature.geometry.coordinates;
                    const coord = coords[idx];
                    if (coord) {
                        const latlng = [coord[1], coord[0]]; // [lat, lng]
                        // Supprime l'ancien marker de survol s'il existe
                        if (this.hoverMarker) {
                            this.fullmap.removeLayer(this.hoverMarker);
                        }
                        // Ajoute un nouveau marker (ou déplace l'existant)
                        this.hoverMarker = L.circleMarker(latlng, {
                            radius: 7,
                            color: 'orange',
                            fillColor: 'yellow',
                            fillOpacity: 0.8,
                            weight: 2
                        }).addTo(this.fullmap);
                    }
                }
            });

            // Ajoute un événement au clic sur le graphe
            this.uplot.root.addEventListener('click', (e) => {
                const idx = this.uplot.cursor.idx;
                if (idx != null && idx >= 0 && idx < x.length) {
                   // Récupère la position correspondante dans le GeoJSON
                    const coords = this._feature.geometry.coordinates;
                    const coord = coords[idx];
                    if (coord) {
                        const latlng = [coord[1], coord[0]]; // [lat, lng]
                        // Supprime l'ancien marker de survol s'il existe
                        if (this.hoverMarker) {
                            this.fullmap.removeLayer(this.hoverMarker);
                        }
                        // Ajoute un nouveau marker (ou déplace l'existant)
                        this.hoverMarker = L.circleMarker(latlng, {
                            radius: 7,
                            color: 'orange',
                            fillColor: 'yellow',
                            fillOpacity: 0.8,
                            weight: 2
                        }).addTo(this.fullmap);
                        this.fullmap.setZoom(15);
                    }

                    this.fullmap.panTo(this.hoverMarker.getLatLng())

                    // // Par exemple, tu peux déclencher une action ou un événement personnalisé
                    // const heure = arrayHour[idx];
                    // const alt = y1[idx];
                    // const sol = y2[idx];
                    // console.log('Clic sur le graph à l’index', idx, 'Heure:', heure, 'Altitude:', alt, 'Sol:', sol);

                    // // Exemple : émettre un événement personnalisé
                    // this.dispatchEvent(new CustomEvent('graph-click', {
                    //     detail: { idx, heure, alt, sol }
                    // }));
                }
            });
        }
    }

    updateHeader() {
        // Met à jour le contenu des dropdowns
        const infoBtn = document.getElementById('info-dropdown-btn');
        if (infoBtn) {
            infoBtn.textContent = this.gettext('Infos');
        }
        const infoDropdownMenu = document.getElementById('info-dropdown-menu');
        if (infoDropdownMenu) {
            infoDropdownMenu.innerHTML = this.generateInfoSections();
        }
        const chronoBtn = document.getElementById('chrono-dropdown-btn');
        if (chronoBtn) {
            chronoBtn.textContent = this.gettext('Pathway');
        }        
        const chronoDropdownMenu = document.getElementById('chrono-dropdown-menu');
        if (chronoDropdownMenu) {
            chronoDropdownMenu.innerHTML = this.generateChronoSections();
        }
        const checkBtn = document.getElementById('check-dropdown-btn');
        if (checkBtn) {
            checkBtn.textContent = this.gettext('Check');
        }
        const scoreBtn = document.getElementById('score-dropdown-btn');
        if (scoreBtn) {
            scoreBtn.textContent = this.gettext('Score');
        }
        const scoreDropdownMenu = document.getElementById('score-dropdown-menu');
        if (scoreDropdownMenu) {
            //scoreDropdownMenu.innerHTML = this.generateScoreMenu();
            scoreDropdownMenu.innerHTML = generateScoreMenu(this.gettext.bind(this), this.runXcScore.bind(this));
        }        
    }

    generateInfoSections() {
        const dateTkoff = new Date(this._feature.properties.coordTimes[0])  // to get local time
        // getMonth returns integer from 0(January) to 11(December)
        const dTkOff = String(dateTkoff.getDate()).padStart(2, '0')+'/'+String((dateTkoff.getMonth()+1)).padStart(2, '0')+'/'+dateTkoff.getFullYear()     
        const hTkoff =  dateTkoff.getUTCHours().toString().padStart(2, '0') + ':' +dateTkoff.getUTCMinutes().toString().padStart(2, '0');
        const dateLand = new Date(this._feature.properties.coordTimes[this._feature.properties.coordTimes.length - 1])
        const hLand =  dateLand.getUTCHours().toString().padStart(2, '0') + ':' +dateLand.getUTCMinutes().toString().padStart(2, '0');
        const durationFormatted = new Date(this._flightData.V_Track.stat.duration*1000).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0]
        const avgTransSpeed =  (Math.round(this._flightAnalyze?.avgTransSpeed * 100) / 100).toFixed(0)
        const avgThermalClimb = (Math.round(this._flightAnalyze?.avgThermalClimb * 100) / 100).toFixed(2)
        const  h = Math.floor(this._flightAnalyze?.extractTime / 3600)
        const m = Math.floor(this._flightAnalyze?.extractTime % 3600 / 60)
        const s = Math.floor(this._flightAnalyze?.extractTime % 3600 % 60)
        const hDisplay = h > 0 ? h + (h == 1 ? "h" : "h") : ""
        const mDisplay = m > 0 ? m + (m == 1 ? "mn" : "mn") : ""
        const sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : ""
        const hExtractTime = hDisplay + mDisplay + sDisplay    

        const fields = [
            { id: 'date', label: this.gettext('Date'), value: this._flightData?.V_Track?.info.date },
            { id: 'site', label: this.gettext('Site'), value: 'PLANFAIT FRANCE' },

            { id: 'pilot', label: this.gettext('Pilot'), value: this._flightData?.V_Track?.info.pilot },
            { id: 'glider', label: this.gettext('Glider'), value: this._flightData?.V_Track?.info.gliderType },

            { id: 'tkofftime', label: this.gettext('Take off'), value: hTkoff },
            { id: 'tkoffalt', label: this.gettext('GPS alt'), value: this._flightData?.V_Track?.fixes[0].gpsAltitude+' m '},

            { id: 'landtime', label: this.gettext('Landing'), value: hLand },
            { id: 'tkoffalt', label: this.gettext('GPS alt'), value: this._flightData?.V_Track?.fixes[this._flightData?.V_Track?.fixes.length - 1].gpsAltitude+' m '},
            
            { id: 'duration', label: this.gettext('Duration'), value: durationFormatted },
            { id: 'size', label: this.gettext('Size'), value: this._flightData.V_Track.stat.distance.toFixed(2)+' km'},

            { id: 'maxalt', label: this.gettext('Max GPS alt'), value: this._flightData?.V_Track?.stat.maxalt.gps+' m'},
            { id: 'minalt', label: this.gettext('Min GPS alt'), value: this._flightData?.V_Track?.stat.minialt.gps+' m'},

            { id: 'maxclimb', label: this.gettext('Max climb'), value: this._flightData?.V_Track?.stat.maxclimb+' m/s' },
            { id: 'maxsink', label: this.gettext('Max sink'), value: this._flightData?.V_Track?.stat.maxsink+' m/s' },

            { id: 'maxgain', label: this.gettext('Max gain'), value: this._flightAnalyze.bestGain+' m' },
            { id: 'maxspeed', label: this.gettext('Max speed'), value: this._flightData?.V_Track?.stat.maxspeed+' km/h' },

            { id: 'bestglide', label: this.gettext('Best transition'), value: (this._flightAnalyze.bestGlide/1000).toFixed(2)+' km' }, 
            { id: 'empty1', label: '', value: '' },                       

            { id: 'avgtrans', label: this.gettext('Avg transition speed'), value: avgTransSpeed+' km/h' },
            { id: 'empty2', label: '', value: '' },

            { id: 'avgthermal', label: this.gettext('Avg thermal climb'), value: avgThermalClimb+' m/s' },
            { id: 'empty3', label: '', value: '' },

            { id: 'extracttime', label: this.gettext('Extraction time'), value: hExtractTime },
            { id: 'empty4', label: '', value: '' },    

            { id: 'efficiency', label: this.gettext('Avg th efficiency'), value: Math.ceil(this._flightAnalyze?.avgThermalEffi)+' %' },
            { id: 'empty5', label: '', value: '' },    

        ];

        // Regroupe les champs deux par deux
        let html = '';
        for (let i = 0; i < fields.length; i += 2) {
            const f1 = fields[i];
            const f2 = fields[i + 1];
            html += `<div class="info-row" style="display: flex; justify-content: space-between; gap: 12px;">
                <span>
                    <b id="label-${f1.id}">${this.gettext(f1.label)}${f1.label ? ' :' : ''}</b>
                    <span id="value-${f1.id}"${f1.id === 'efficiency' ? ' class="efficiency-highlight"' : ''}>${f1.value ?? ''}</span>
                </span>
                ${f2 ? `<span>
                    <b id="label-${f2.id}">${f2.label ? this.gettext(f2.label) + ' :' : ''}</b>
                    <span id="value-${f2.id}"${f2.id === 'efficiency' ? ' class="efficiency-highlight"' : ''}>${f2.value ?? ''}</span>
                </span>` : ''}
            </div>`;
        }
        html += `<div style="margin:12px 0 0 0;">${this.generateMiniBar()}</div>`;
        return html;
    }

    generateMiniBar() {
        const percThermals = Math.round(this._flightAnalyze?.percThermals * 100) ?? 0;
        const percGlides   = Math.round(this._flightAnalyze?.percGlides * 100) ?? 0;
        const percDives    = Math.round(this._flightAnalyze?.percDives * 100) ?? 0;
        const percVarious  = Math.round(100 - (percThermals + percGlides + percDives));

        // Prépare les segments et légendes
        const segments = [];
        const legends = [];

        // Prépare les données
        const bars = [
            { value: percThermals, color: '#ffb300', label: this.gettext('Thermal') },
            { value: percGlides,   color: '#1976d2', label: this.gettext('Glide') },
            ...(percDives > 0 ? [{ value: percDives, color: '#c62828', label: this.gettext('Dive') }] : []),
            { value: percVarious,  color: '#43a047', label: this.gettext('Various') }
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

    generateChronoSections() {
        let htmlText = /*html */ `
                <div>
                <table style="width:100%; border-collapse:collapse; font-size:1em;">
                    <thead>
                    <tr style="background:#f8f9fa;">
                        <th style="padding:8px 6px; text-align:left;">${this.gettext('Heure')}</th>
                        <th style="padding:8px 6px; text-align:left;">${this.gettext('Ecoulé')}</th>
                        <th style="padding:8px 6px; text-align:left;">${this.gettext('Alt')}</th>
                        <th style="padding:8px 6px; text-align:left;"></th>
                        <th style="padding:8px 6px; text-align:left;"></th>
                    </tr>
                    </thead>
                    <tbody>
                `;

        let rowIndex = 0;
        for (let cr of this._flightAnalyze.course) {
            const bgColor = rowIndex % 2 === 0 ? '#f2f2f2' : '#fff';

            let icon = '';
            let label = '';
            let info = '';
            let link = '';
            switch (cr.category) {
                case 'K':
                    icon = '<i class="bi bi-send"></i>';
                    label = this.gettext('Décollage');
                    info = '';
                    link = `<a href="#" class="takeoff-link" style="color:#1976d2; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                        ${icon} ${label}
                    </a>`;
                    break;
                case 'T':
                    icon = '<i class="bi bi-cloud-arrow-up"></i>';
                    label = this.gettext('Thermique');
                    info = `[+${cr.data1}m ${(Math.round(cr.data2 * 100) / 100).toFixed(2)}m/s]`;
                    link = `<a href="#" class="segment-link" data-segment='${JSON.stringify(cr.coords)}' style="color:#43a047; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                        ${icon} ${label}
                    </a>`;
                    break;
                case 'G':
                    icon = '<i class="bi bi-arrow-right"></i>';
                    label = this.gettext('Transition');
                    info = `[+${cr.data1}km ${cr.data2}km/h]`;
                    link = `<a href="#" class="segment-link" data-segment='${JSON.stringify(cr.coords)}' style="color:#ff9800; font-weight:bold; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                        ${icon} ${label}
                    </a>`;
                    break;
                case 'L':
                    icon = '<i class="bi bi-flag"></i>';
                    label = this.gettext('Atterrissage');
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

    displaySegment(coords) {
        // Si coords est une chaîne, transforme-la en tableau de nombres
        if (typeof coords === 'string') {
            coords = coords.split(',').map(Number);
        }
        // Si coords est une flat list de nombres, regroupe par paires
        if (Array.isArray(coords) && coords.length > 0 && typeof coords[0] === 'number') {
            const points = [];
            for (let i = 0; i < coords.length; i += 2) {
                points.push([coords[i], coords[i + 1]]);
            }
            coords = points;
        }
        // Vérifie que coords est bien un tableau de points
        if (!Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0])) {
            console.warn('coords n’est pas un tableau de points valide', coords);
            return;
        }
        // Transforme en latlngs pour fitBounds ([lat, lng])
        const latlngs = coords.map(coord => [coord[0], coord[1]]);

        // Ajuste la vue pour inclure le segment
        this.fullmap.fitBounds(latlngs);
        // Trop serré, on recule d'un niveau de zoom
        const currentZoom = this.fullmap.getZoom();
      //  this.fullmap.setZoom(currentZoom - 1);
    }
   
    async runXcScore(selLeague) {
        // igc-xc-score attends une date au format YYYY-MM-DD
        // this._flightData?.V_Track?.info.date est au format DD/MM/YYYY
        const dateStr = this._flightData?.V_Track?.info.date;
        if (!dateStr) {
            console.warn('Date de vol non disponible pour le calcul du score XC');
            return;
        }
        const [day, month, year] = dateStr.split('/');
        const flightDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log('Score :', selLeague,' pour ',this._flightData?.V_Track?.fixes.length,' points  date : ',this._flightData?.V_Track.info.date,'  ',flightDate);
        const params = {
            invoketype: 'igc:scoring', 
            args: {
                date : flightDate,
                fixes : this._flightData.V_Track.fixes,
                league: selLeague
            }
        }
        const resScoring = await window.electronAPI.invoke(params);                        
        if (resScoring.success) {
            this.displayScoringResult(this, selLeague, resScoring.geojson);
        } else {
            console.warn('Erreur lors du calcul du score XC', resScoring.error);
        }
    }

    displayScoringResult(context, league, geojson) {  
        const leagueColor = getLeagueColor(league);
        let drawingColor = leagueColor.namedColor;
        let textColor = leagueColor.hexaColor;
        const scoreDropdownMenu = document.getElementById('score-dropdown-menu');
        if (scoreDropdownMenu) {
           // scoreDropdownMenu.innerHTML = this.generateScoreTable(league, textColor, geojson);
            scoreDropdownMenu.innerHTML = generateScoreTable(this.gettext.bind(this), league, textColor, geojson);
            this._scoreMenuState = 'result';
        }
        // Supprime l'ancienne couche de score si elle existe
        if (this._scoreLayer) {
            this.fullmap.removeLayer(this._scoreLayer);
        }    
        // Crée une nouvelle couche GeoJSON pour le score
        this._scoreLayer = L.geoJson(geojson, {
            style: function(feature) {
                return {
                    stroke: true,
                    color: drawingColor,
                    weight: 4,
                    opacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.popupContent) {
                    if (feature.geometry && feature.geometry.type === 'Point') {
                        layer.bindPopup(
                            `<b>${league} :</b><br> ${feature.properties.popupContent}`
                        );
                    } else if (feature.geometry && feature.geometry.type === 'LineString') {
                        layer.bindTooltip(
                            `<b>${league} :</b><br> ${feature.properties.popupContent}`,
                            { permanent: true, direction: 'auto', className: 'score-tooltip' }
                        );
                    }
                }
        }
        });

        // Ajoute la couche de score à la carte
        this._scoreLayer.addTo(this.fullmap);
        // Ouvre tous les popups des LineString
        this._scoreLayer.eachLayer(layer => {
            if (layer.feature && layer.feature.geometry && layer.feature.geometry.type === 'LineString') {
                layer.openPopup();
            }
        });
        if (this._layercontrol) {
            this._layercontrol.addOverlay(this._scoreLayer, this.gettext('Score'));
        }
        // Ajuste la vue pour inclure la couche de score
        this.fullmap.fitBounds(this._scoreLayer.getBounds());
    }
     
    initFullmapModalHeader() {
        const modalHeader = document.getElementById('fullmap-modal-header');
        if (modalHeader) {
            modalHeader.innerHTML = /*html */ `
                <div style="display: flex; align-items: center; gap: 12px; margin-left: 30px;">
                    <div class="dropdown">
                        <button id="info-dropdown-btn" class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Infos
                        </button>
                        <div class="dropdown-menu p-3" id="info-dropdown-menu" style="max-width:500px; width:500px; font-size:0.75em;">
                            <!-- Le contenu sera injecté dynamiquement -->
                        </div>
                    </div>
                    <div class="dropdown">
                        <button id="chrono-dropdown-btn" class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Chrono
                        </button>
                        <div class="dropdown-menu p-3" id="chrono-dropdown-menu" style="max-width:500px; width:500px; font-size:0.75em; max-height:350px; overflow-y:auto;">
                            <!-- Le contenu sera injecté dynamiquement -->
                        </div>
                    </div>
                    <div class="dropdown">
                        <button id="check-dropdown-btn" class="btn btn-warning dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Check
                        </button>
                        <div class="dropdown-menu p-3" id="check-dropdown-menu" style="max-width:500px; width:500px; font-size:0.75em;">
                            <!-- Le contenu sera injecté dynamiquement -->
                        </div>
                    </div>
                    <div class="dropdown">
                        <button id="score-dropdown-btn" class="btn btn-info dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Score
                        </button>
                        <div class="dropdown-menu p-3" id="score-dropdown-menu" style="max-width:500px; width:500px; font-size:0.75em;">
                            <!-- Le contenu sera injecté dynamiquement -->
                        </div>
                    </div>
                    <button id="measure-btn" class="btn btn-secondary btn-sm" type="button">
                        Mesurer
                    </button>                    
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="modal-fullscreen-btn" title="Plein écran">
                        <i class="bi bi-arrows-fullscreen"></i>
                    </button>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                </div>
            `;

            modalHeader.style.background = "#fff";
            modalHeader.style.borderBottom = "1px solid #ddd";

            const fsBtn = modalHeader.querySelector('#modal-fullscreen-btn');
            const fsIcon = fsBtn.querySelector('i');
            const modalBody = document.getElementById('fullmap-modal-body');
            if (fsBtn && modalBody) {
                fsBtn.addEventListener('click', () => {
                    if (!document.fullscreenElement) {
                        modalBody.requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    }
                });
                document.addEventListener('fullscreenchange', () => {
                    if (document.fullscreenElement) {
                        fsIcon.classList.remove('bi-arrows-fullscreen');
                        fsIcon.classList.add('bi-fullscreen-exit');
                    } else {
                        fsIcon.classList.remove('bi-fullscreen-exit');
                        fsIcon.classList.add('bi-arrows-fullscreen');
                    }
                });
            }
            const chronoBtn = modalHeader.querySelector('#chrono-dropdown-btn');
            if (chronoBtn) {
                chronoBtn.addEventListener('click', () => {
                    if (this._thermalLayer && !this.fullmap.hasLayer(this._thermalLayer)) {
                        this._thermalLayer.addTo(this.fullmap);
                    }
                    if (this._glideLayer && !this.fullmap.hasLayer(this._glideLayer)) {
                        this._glideLayer.addTo(this.fullmap);
                    }
                });
            }
            const measureBtn = modalHeader.querySelector('#measure-btn');
            if (measureBtn) {
                measureBtn.addEventListener('click', () => {
                    // Action à définir pour la mesure
                    console.log('Mesure activée');
                    // Par exemple, activer le plugin de mesure Leaflet :
                    if (this.fullmap && this.measureControl) {
                        this.measureControl._toggleMeasure();
                    }
                });
            }

            const scoreBtn = modalHeader.querySelector('#score-dropdown-btn');
            const scoreDropdownMenu = modalHeader.querySelector('#score-dropdown-menu');
            this._scoreMenuState = 'menu'; // état initial

            if (scoreBtn && scoreDropdownMenu) {
                scoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this._scoreMenuState === 'result') {
                        // On revient au menu initial
                        scoreDropdownMenu.innerHTML = generateScoreMenu(this.gettext.bind(this), this.runXcScore.bind(this));
                        this._scoreMenuState = 'menu';
                    }
                    // Sinon, le comportement par défaut (affichage du menu)
                    // Rien à faire ici, le menu est déjà affiché
                });
            }            
                        
        }
    }    

    gettext(key) {
        return this._i18n[key] || key;
    }        
}

window.customElements.define('fullmap-track', FullmapTrack);