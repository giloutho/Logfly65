import { baseMaps, osmlayer, OpenTopoMap,ignlayer,sat } from '../../../../../js/leaflet-layers.js';
import {  mtklayer, Esri_WorldTopoMap, outdoorlayer,oaciFrLayer } from '../../../../../js/leaflet-layers.js';
import {  trackOptions, thermOptions, glideOptions, StartIcon, EndIcon } from '../../../../../js/leaflet-options.js';

class FullmapTrack extends HTMLElement {
    constructor() {
        super();
        this.i18n = {} // initialisé par le parent
        this.fullmap = null; 
        this._flightData = null; 
        this._flightAnalyze = null;
        this._geojsonLayer = null;
        this.startMarker = null; 
        this.endMarker = null; 
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
                    background: rgba(248, 248, 248, 0.7);
                    font-size: 1em;
                    border-bottom: 1px solid #ddd;
                    padding: 4px 8px;
                    margin: 0;
                    pointer-events: none; /* pour ne pas gêner les interactions carte */
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
            </style>
            <div id="map">
                <div id="graph-info"></div>
                <div id="graph"></div>
            </div>
        `;
    }

    setupEventListeners(){
        // Écouteur d'événements ou autres configurations si nécessaire
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
        // Ici tu peux déclencher un rendu ou une mise à jour de la carte
        this.updateMap();
    }

    get flightAnalyze() {
        return this._flightAnalyze;
    }   

    updateMap() {
        if (!this._flightData.V_Track.GeoJSON) return;

        this.mapLoadGeoJSON();
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
    }

    mapLoadGeoJSON() {
        // Retire l'ancienne couche si elle existe
        if (this._geojsonLayer) {
            this.fullmap.removeLayer(this._geojsonLayer);
        }

        try {
            const feature = this._flightData.V_Track.GeoJSON.features[0];
            if (feature && feature.geometry && feature.geometry.type === 'LineString') {
                const coords = feature.geometry.coordinates;
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
        const feature = this._flightData.V_Track.GeoJSON.features[0];
        const arrayAlti = feature['geometry']['coordinates'].map(coord => coord[2]);
        const arraySol = this._flightAnalyze && this._flightAnalyze.elevations
            ? this._flightAnalyze.elevations
            : [];
        // times contained in the GeoJSon are only strings
        // conversion to date object is necessary for Highcharts.dateFormat to work on the x axis
        const arrayHour = feature['properties']['coordTimes'].map(hour => new Date(hour));
          console.log('arrayHour 50 ex '+arrayHour[50]+' type '+typeof(arrayHour[50]))
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
                        stroke: "red",
                        width: 2,
                        fill: "rgba(255,0,0,0.2)" // Remplissage sous la courbe
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
            const uplot = new uPlot(options, data, graphDiv);

            const graphInfoDiv = this.querySelector('#graph-info');
            if (graphInfoDiv) {
                graphInfoDiv.textContent = ''; // vide au départ
            }

            // Affichage dynamique de l'info au survol
            uplot.root.addEventListener('mousemove', e => {
                const idx = uplot.cursor.idx;
                if (idx != null && idx >= 0 && idx < x.length) {
                    const heure = arrayHour[idx];
                    const alt = y1[idx];
                    const sol = y2[idx];
                    graphInfoDiv.textContent = 
                        `Time: ${heure.getUTCHours().toString().padStart(2, '0')}:${heure.getUTCMinutes().toString().padStart(2, '0')} | Altitude: ${alt} m | Altitude sol: ${sol}`;
                }
            });

            // Ajoute un événement au clic sur le graphe
            uplot.root.addEventListener('click', (e) => {
                const idx = uplot.cursor.idx;
                if (idx != null && idx >= 0 && idx < x.length) {
                    // Par exemple, tu peux déclencher une action ou un événement personnalisé
                    const heure = arrayHour[idx];
                    const alt = y1[idx];
                    const sol = y2[idx];
                    console.log('Clic sur le graph à l’index', idx, 'Heure:', heure, 'Altitude:', alt, 'Sol:', sol);

                    // Exemple : émettre un événement personnalisé
                    this.dispatchEvent(new CustomEvent('graph-click', {
                        detail: { idx, heure, alt, sol }
                    }));
                }
            });
        }
    }

    gettext(key) {
        return this.i18n[key] || key;
    }   
}

window.customElements.define('fullmap-track', FullmapTrack);