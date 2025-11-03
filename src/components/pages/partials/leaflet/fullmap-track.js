import { baseMaps, osmlayer, OpenTopoMap,ignlayer,sat } from '../../../../../js/leaflet-layers.js';
import {  mtklayer, Esri_WorldTopoMap, outdoorlayer,oaciFrLayer } from '../../../../../js/leaflet-layers.js';
import {  trackOptions, thermOptions, glideOptions, StartIcon, EndIcon } from '../../../../../js/leaflet-options.js';

class FullmapTrack extends HTMLElement {
    constructor() {
        super();
        this.i18n = {} // initialisé par le parent
        this.fullmap = null; 
        this._flightData = null; 
        this._feature = null
        this._flightAnalyze = null;
        this._geojsonLayer = null;
        this.startMarker = null; 
        this.endMarker = null; 
        this.hoverMarker = null;
        this.uplot = null;
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
                .info-popup {
                    position: absolute;
                    bottom: 160px; /* Ajuster en fonction de la hauteur de #graph-info */
                    left: 20px;    /* Place à gauche */
                    right: auto;   /* Annule le positionnement à droite */
                    z-index: 3000;
                    width: 300px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                    font-family: Arial, sans-serif;
                    font-size: 0.9em;
                }
                .info-popup-header {
                background: #fff;
                color: #222;
                padding: 4px 10px; /* Hauteur réduite */
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border: 3px solid #0837f5ff;
                border-radius: 8px 8px 0 0;
                box-sizing: border-box;
                }
                .info-popup-title {
                    margin: 0;
                    font-weight: 500;
                    font-size: 1.3em; /* augmente la taille, ajuste selon besoin */
                }
                .info-popup-arrow {
                    font-size: 1.2em;
                    transition: transform 0.3s;
                }
                .info-popup.closed .info-popup-arrow {
                    transform: rotate(180deg);
                }
                .info-popup-content {
                    padding: 10px;
                    display: none;
                }
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
                <div id="info-popup" class="info-popup closed">
                  <div class="info-popup-header" id="info-popup-toggle">
                    <span class="info-popup-title">Infos</span>
                    <span class="info-popup-arrow">&#x25BC;</span> <!-- flèche vers le bas -->
                  </div>
                    <div class="info-popup-content" id="info-popup-content"></div>
                </div>
            </div>
        `;
    }

    setupEventListeners(){
        // Écouteur d'événements ou autres configurations si nécessaire
        const infoPopupToggle = this.querySelector('#info-popup-toggle');
        const infoPopup = this.querySelector('#info-popup');
        if (infoPopupToggle) {
            infoPopupToggle.addEventListener('click', () => {
                infoPopup.classList.toggle('closed');
                const isClosed = infoPopup.classList.contains('closed');
                // Changer la flèche en fonction de l'état
                const arrow = infoPopupToggle.querySelector('.info-popup-arrow');
                if (arrow) {
                    arrow.style.transform = isClosed ? 'rotate(180deg)' : 'rotate(0deg)';
                }
                // Afficher ou cacher le contenu
                const content = infoPopup.querySelector('.info-popup-content');
                if (content) {
                    content.style.display = isClosed ? 'none' : 'block';
                }
            });
        }
    }

    async initMap() {
        // Initialiser la carte en la centrant sur Genève
        this.fullmap = L.map('map').setView([46.2044, 6.1432], 13);
        const layerControl = new L.control.layers(baseMaps).addTo(this.fullmap);
        this.setDefaultLayer();
    }    

    async setDefaultLayer() {
        // Retirer toutes les couches existantes
        Object.values(baseMaps).forEach(layer => {
            if (this.fullmap.hasLayer(layer)) {
                this.fullmap.removeLayer(layer);
            }
        });
        const defaultMap = await window.electronAPI.storeGet('map');
        switch (defaultMap) {
        case 'open':
            baseMaps.OpenTopo.addTo(this.fullmap);
            break
        case 'ign':
            baseMaps.IGN.addTo(this.fullmap);
            break
        case 'sat':
            baseMaps.Satellite.addTo(this.fullmap);
            break
        case 'osm':
            baseMaps.OSM.addTo(this.fullmap);
            break
        case 'mtk':
            baseMaps.MTK.addTo(this.fullmap);
            break
        case 'esri':
            baseMaps.EsriTopo.addTo(this.fullmap);
            break
        case 'out':
            baseMaps.Outdoor.addTo(this.fullmap);
            break   
        default:
            baseMaps.OSM.addTo(this.fullmap);  
            break  
        }            
        // Ajouter la couche sélectionnée par défaut
        const selectedLayer = baseMaps[defaultMap];
        if (selectedLayer) {
            this.fullmap.addLayer(selectedLayer);
        } else {
            // Si la couche n'existe pas, ajouter OpenStreetMap par défaut
            osmlayer.addTo(this.fullmap);
        }
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
        console.log('Mise à jour de flightAnalyze dans FullmapTrack :', this._flightAnalyze.bestGain);        
        console.log('Réception elevation dans FullmapTrack :', this._flightAnalyze.elevations.length, ' points');
        // flightAnalyze contient l'objet d'analyse du vol
        // flightData et FlightAnalyze chargés, on peut mettre à jour la carte
        this.updateMap();
    }

    get flightAnalyze() {
        return this._flightAnalyze;
    }   

    updateMap() {
        if (!this._flightData.V_Track.GeoJSON) return;

        this.mapLoadGeoJSON();
        this.mapDrawGraph();
        // Mise à jour dynamique du contenu de la popup
        const infoPopupContent = this.querySelector('#info-popup-content');
        if (infoPopupContent) {
            infoPopupContent.innerHTML = this.generateInfoSections();
        }
        try {
            // Si la carte Leaflet est dans une modale Bootstrap (ou un élément caché),
            // Leaflet ne connaît pas la taille réelle de la carte au moment de l’appel à fitBounds.
            // Solution : this.fullmap.invalidateSize(); juste avant ou juste après fitBounds :
            this.fullmap.invalidateSize();
            this.fullmap.fitBounds(this._geojsonLayer.getBounds());
        } catch (e) {
            console.log('Error fitting bounds:', e);
        }
    }

    mapLoadGeoJSON() {
        // Retire l'ancienne couche si elle existe
        if (this._geojsonLayer) {
            this.fullmap.removeLayer(this._geojsonLayer);
        }

        try {
            if (this._feature && this._feature.geometry && this._feature.geometry.type === 'LineString') {
                const coords = this._feature.geometry.coordinates;
                if (coords.length > 0) {
                    // GeoJSON: [longitude, latitude]
                    const firstLatLng = { lat: coords[0][1], lng: coords[0][0] };
                    const lastLatLng = { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] };
                    if (firstLatLng) {
                        this.startMarker = L.marker([firstLatLng.lat, firstLatLng.lng], { icon: StartIcon }).addTo(this.fullmap);
                    }
                    if (lastLatLng) {
                        this.endMarker = L.marker([lastLatLng.lat, lastLatLng.lng], { icon: EndIcon }).addTo(this.fullmap);
                    }                    
                }
            }
        } catch (e) {
            console.log('Erreur extraction points GeoJSON', e);
        }
        // Ajoute la nouvelle couche et garde la référence
        this._geojsonLayer = L.geoJson(this._flightData.V_Track.GeoJSON, { style: trackOptions });
        this._geojsonLayer.addTo(this.fullmap);
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

    gettext(key) {
        return this.i18n[key] || key;
    }        
}

window.customElements.define('fullmap-track', FullmapTrack);