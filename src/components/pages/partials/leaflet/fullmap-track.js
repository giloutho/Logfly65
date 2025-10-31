import { baseMaps, osmlayer, OpenTopoMap,ignlayer,sat } from '../../../../../js/leaflet-layers.js';
import {  mtklayer, Esri_WorldTopoMap, outdoorlayer,oaciFrLayer } from '../../../../../js/leaflet-layers.js';
import {  trackOptions, thermOptions, glideOptions, StartIcon, EndIcon } from '../../../../../js/leaflet-options.js';

class FullmapTrack extends HTMLElement {
    constructor() {
        super();
        this.fullmap = null; 
        this._flightData = null; 
        this._flightAnalyze = null;
        this._geojsonLayer = null; 
    }

    connectedCallback() {
        this.render();
        this.initMap();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = /*html */ ` 
            <style>
                #map {
                    width: 100%;
                    height: 85vh; /* hauteur explicite, à adapter si besoin */
                    min-height: 400px;
                    max-height: 100vh;
                    margin: 0;
                    padding: 0;
                }
            </style>
            <div id="map"></div>             
            <div id="graph"></div>
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
        // flightAnalyze contient l'objet d'analyse du vol
        // Ici tu peux déclencher un rendu ou une mise à jour de la carte
        this.updateMap();
    }

    get flightAnalyze() {
        return this._flightAnalyze;
    }   

    updateMap() {
        if (!this._flightData.V_Track.GeoJSON) return;

        // Retire l'ancienne couche si elle existe
        if (this._geojsonLayer) {
            this.fullmap.removeLayer(this._geojsonLayer);
        }

        // Ajoute la nouvelle couche et garde la référence
        this._geojsonLayer = L.geoJson(this._flightData.V_Track.GeoJSON, { style: trackOptions });
        this._geojsonLayer.addTo(this.fullmap);

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
}

window.customElements.define('fullmap-track', FullmapTrack);