import { thermalIcon, glideIcon } from './fullmap-track-utils.js';
import {  trackOptions, thermOptions, glideOptions } from '../../../../../js/leaflet-options.js';
import { baseMaps, osmlayer, OpenTopoMap,ignlayer,sat } from '../../../../../js/leaflet-layers.js';
import { createPopThermal, createPopGlide } from './fullmap-track-popups.js';

export async function initMap() {
    // Initialiser la carte en la centrant sur Genève
    this.fullmap = L.map('map').setView([46.2044, 6.1432], 13);
    // Ajoute le contrôle de mesure
    if (window.measure) {
        this.measureControl = new window.measure();
        this.fullmap.addControl(this.measureControl);
    }
}    

export async function setDefaultLayer() {
    // Retirer toutes les couches existantes
    Object.values(baseMaps).forEach(layer => {
        if (this.fullmap.hasLayer(layer)) {
            this.fullmap.removeLayer(layer);
        }
    });
    if (this._geojsonLayer && this.fullmap.hasLayer(this._geojsonLayer)) {
        this.fullmap.removeLayer(this._geojsonLayer);
    }
    if (this._thermalLayer && this.fullmap.hasLayer(this._thermalLayer)) {
        this.fullmap.removeLayer(this._thermalLayer);
    }
    if (this._glideLayer && this.fullmap.hasLayer(this._glideLayer)) {
        this.fullmap.removeLayer(this._glideLayer);
    }     
    if (this._scoreLayer && this.fullmap.hasLayer(this._scoreLayer)) {
        this.fullmap.removeLayer(this._scoreLayer);
    }    
    if (this._openaipGroup) {
        this.fullmap.removeLayer(this._openaipGroup);
        this._openaipGroup = null;
    }
    // Suppression du controleur de couches
    if (this._layercontrol) {
        this.fullmap.removeControl(this._layercontrol);
        this._layercontrol = null;
    }               
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

export function mapLoadGeoJSON() {
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

export function mapLoadThermals() {
    const thermalLayerOption = {
        style: thermOptions, 
        pointToLayer: thermalIcon,
        onEachFeature: (feature, layer) => createPopThermal(feature, layer, this.gettext.bind(this))
    }
    this._thermalLayer = L.geoJson(this._flightAnalyze.geoThermals, thermalLayerOption)
    // On ne l'ajoute pas par défaut this._thermalLayer.addTo(this.fullmap);
}

export function mapLoadGlides() {
    const glideLayerOption = {
        style: glideOptions, 
        pointToLayer: glideIcon,
        onEachFeature: (feature, layer) => createPopGlide(feature, layer, this.gettext.bind(this))
    }
    this._glideLayer =  L.geoJson(this._flightAnalyze.geoGlides, glideLayerOption)
    // On ne l'ajoute pas par défaut geoGlides.addTo(this.fullmap);
}

export function mapUpdateControls() {
    const kk7layer = L.tileLayer('https://thermal.kk7.ch/tiles/skyways_all_all/{z}/{x}/{y}.png?src=logfly.org', {
        attribution: 'thermal.kk7.ch <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC-BY-NC-SA>/a>',
        maxNativeZoom: 13,
        tms: true,
        opacity: 0.5
    })

    const kk7Group = new L.LayerGroup()
    kk7Group.addLayer(kk7layer)

    this._openaipLayer = new L.layerGroup();

    const mTrack = this.gettext('Track')
    const mThermal = this.gettext('Thermals')
    const mTrans = this.gettext('Transitions')
    const mScore = this.gettext('Score')

    const displayControl = {
        [mTrack] : this._geojsonLayer,
        [mThermal] : this._thermalLayer,
        [mTrans]: this._glideLayer,
    }

    this._layercontrol = new L.control.layers(baseMaps, displayControl).addTo(this.fullmap);

    this._layercontrol.addOverlay(kk7Group, "Thermal.kk7.ch");

}

export function displaySegment(coords) {
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

const StartIcon = new L.Icon({
    iconUrl: './static/images/windsock22.png',
    shadowUrl: './static/images/marker-shadow.png',
    iconSize: [22, 22],
    iconAnchor: [0, 22],
    popupAnchor: [1, -34],
    shadowSize: [25, 25]
})     

const EndIcon = new L.Icon({
    iconUrl: './static/images/arrivee22.png',
    shadowUrl: './static/images/marker-shadow.png',
    iconSize: [18, 18],
    iconAnchor: [4, 18],
    popupAnchor: [1, -34],
    shadowSize: [25, 25]
})          