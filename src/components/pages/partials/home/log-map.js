export class LogMap extends HTMLElement {
  constructor() {
    super();
    this.map = null;                
    this.geoJsonLayer = null;      
    this.startIcon = null;
    this.endIcon = null;
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
            #map-pm {
                position: relative;
                width: 100%;
                height: 100% !important;
                margin-top: 10px;
                margin-bottom: 10px;
                min-height: 85vh;
            }
            .map-arrow-overlay {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                z-index: 1000;
                width: 48px; /* adapte la taille si besoin */
                pointer-events: auto;   /* <-- Permet les clics */
                cursor: pointer;        /* Optionnel : curseur main */
            }
            .map-arrow-overlay-right {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                z-index: 1000;
                width: 48px;
                pointer-events: auto;   /* <-- Permet les clics */
                cursor: pointer;        /* Optionnel : curseur main */
            }    
            .map-overlay-label {
                position: absolute;
                left: 50%;
                bottom: 20px;
                transform: translateX(-50%);
                z-index: 1100;
                background: #1a6dcc;
                color: #fff;
                padding: 8px 20px;
                border-radius: 12px;
                font-size: 1.1em;
                pointer-events: none;
                text-align: center;
                min-width: 120px;
                max-width: 80vw;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }                    
            :host {
                display: block;
            }            
            </style>           
            <div id="map-pm">
                <img id="left-arrow" class="map-arrow-overlay" src="./static/images/left-arrow.png" alt="arrow left" />  
                <img id="right-arrow" class="map-arrow-overlay-right" src="./static/images/right-arrow.png" alt="arrow right" />  
                <div id="map-overlay-label" class="map-overlay-label"></div>
            </div>   
        `;
    }

    setupEventListeners() {
        const logTable = document.querySelector('log-table');
        logTable.addEventListener('row-selected', this.rowSelectedHandler);
        const rightArrow = this.querySelector('#right-arrow');
        if (rightArrow) {
            rightArrow.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('select-next-row', {
                    bubbles: true,
                    composed: true
                }));
            });            
        }
        logTable.addEventListener('no-flights', this.mapEmpty.bind(this));
        const leftArrow = this.querySelector('#left-arrow');
        if (leftArrow) {
            leftArrow.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('select-prev-row', {
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }  
    
    rowSelectedHandler = (event) => {
        const rowData = event.detail.rowData;
        this.selectedRowData = rowData;
        this.rowIndex = event.detail.rowIndex;           
        // console.log(`Row index : ${this.rowIndex} - Id_Vol: ${rowData.V_ID} - Engin: ${rowData.V_Engin} - Date: ${rowData.Day} ${rowData.Hour}`);
        
        const flightLabel = rowData.Day+' '+rowData.V_Site+' '+rowData.Duree+' '+rowData.V_Engin;
        const overlay = this.querySelector('#map-overlay-label');
        if (overlay) overlay.textContent = flightLabel;

        this.dbFlight = event.detail.dbFlight;
        if (
            this.dbFlight &&
            this.dbFlight.V_Track &&
            this.dbFlight.V_Track.GeoJSON
        ) {
            // Si GeoJSON existe et n'est pas null
            this.mapWithTrack(this.dbFlight.V_Track.GeoJSON);
        } else {
            // Si GeoJSON est absent ou null
            console.log('Pas de trace pour ce vol');
            this.mapNotrack(this.dbFlight);
        }
    }; 
    
    initMap() {
        // Initialiser la carte en la centrant sur Genève
        // ************ à modifier sur settings ************
        this.map = L.map('map-pm').setView([46.2044, 6.1432], 13);
        
        // Ajouter la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);    
            this.startIcon = new L.Icon({
                iconUrl: './static/images/windsock22.png',
                shadowUrl: './static/images/marker-shadow.png',
                iconSize: [22, 22],
                iconAnchor: [0, 22],
                popupAnchor: [1, -34],
                shadowSize: [25, 25]
            })     
            this.endIcon = new L.Icon({
                iconUrl: './static/images/arrivee22.png',
                shadowUrl: './static/images/marker-shadow.png',
                iconSize: [18, 18],
                iconAnchor: [4, 18],
                popupAnchor: [1, -34],
                shadowSize: [25, 25]
            })             
    }
    
    mapWithTrack(trackGeojson) {
        this.cleanMap();
        // Ajouter le GeoJSON du vol
        if (trackGeojson) {
            // Extraction des coordonnées du premier et dernier point
            let firstLatLng = null;
            let lastLatLng = null;
            try {
                const feature = trackGeojson.features[0];
                if (feature && feature.geometry && feature.geometry.type === 'LineString') {
                    const coords = feature.geometry.coordinates;
                    if (coords.length > 0) {
                        // GeoJSON: [longitude, latitude]
                        firstLatLng = { lat: coords[0][1], lng: coords[0][0] };
                        lastLatLng = { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] };
                    }
                }
            } catch (e) {
                console.log('Erreur extraction points GeoJSON', e);
            }
            if (firstLatLng) {
                 this.startMarker = L.marker([firstLatLng.lat, firstLatLng.lng], { icon: this.startIcon }).addTo(this.map);
            }
            if (lastLatLng) {
                this.endMarker = L.marker([lastLatLng.lat, lastLatLng.lng], { icon: this.endIcon }).addTo(this.map);
            }

            this.geoJsonLayer = L.geoJSON(trackGeojson, {
                style: {
                    color: '#ff3333ff',
                    weight: 2,
                    opacity: 0.85
                }
            }).addTo(this.map);

            try {
                this.map.fitBounds(this.geoJsonLayer.getBounds());
            } catch (e) {
                console.log('Error fitting bounds:', e);
            }            
        }
    }   
    
    mapNotrack(dbFlight) {
        this.cleanMap();
        const latDeco = dbFlight.V_LatDeco || 45.863; // A compléter par les setings
        const longDeco = dbFlight.V_LongDeco || 6.1725;
        if (this.map) {
            this.map.setView([latDeco, longDeco], 12);
        }        
        const takeOffPopUp = dbFlight.V_Site+'<br>'+dbFlight.V_AltDeco+'m'
        const startLatlng = L.latLng(latDeco, longDeco)
        this.startMarker = L.marker(startLatlng,{icon: this.startIcon}).addTo(this.map).bindPopup(takeOffPopUp).openPopup()
    }  

    mapEmpty = (event) => {
        const labelmsg =event.detail.mapMsg
        const defLat = event.detail.defLat
        const defLng = event.detail.defLong
        this.cleanMap();
        if (this.map) {
            this.map.setView([defLat, defLng], 11);
            const flightLabel = labelmsg
            const overlay = this.querySelector('#map-overlay-label');
            if (overlay) overlay.textContent = flightLabel;
        }
    }

    cleanMap() {
        // Retire la couche GeoJSON précédente si elle existe
        if (this.geoJsonLayer) {
            this.map.removeLayer(this.geoJsonLayer);
            this.geoJsonLayer = null;
        }
        // Retire les marqueurs précédents si ils existent
        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
            this.startMarker = null;
        }
        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
            this.endMarker = null;
        } 
    }       
}

customElements.define('log-map', LogMap);
