import "../leaflet/fullmap-track.js";

export class LogMap extends HTMLElement {
  constructor() {
    super();
    this.i18n = {} // initialisé par le parent
    this.map = null;  
    this.dbFlight = null;    
    this.flightLabel = null;          
    this.geoJsonLayer = null;      
    this.startIcon = null;
    this.endIcon = null;
    this.startMarker = null; 
    this.endMarker = null;     
  }

  connectedCallback() {
    this.render();
    // Active tous les tooltips Bootstrap sur la page
    // Initialise tous les tooltips du composant
    this.destroyTooltips();
    this.initTooltips();
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
            .map-overlay-bottom {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 20px;
                z-index: 1100;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                padding: 0 18px;
              /*  pointer-events: none;  pour que seuls les boutons soient cliquables */
            }
            body.modal-open .map-overlay-bottom {
            display: none !important;
            }            
            .map-overlay-label {
                background: #1a6dcc;
                color: #fff;
                padding: 8px 20px;
                border-radius: 12px;
                font-size: 1.1em;
                min-width: 120px;
                max-width: 60vw;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                pointer-events: auto;
                text-align: left;
            }
            .map-buttons {
            /*    display: flex;
                gap: 0.5rem;
                pointer-events: auto;
                Ci dessous test */
                position: absolute;
                bottom: 10px;
                right: 10px;
                z-index: 1000;
                background: rgba(255, 255, 255, 0.95);
                padding: 8px;
                border-radius: 50px;
                display: flex;
                gap: 8px;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);

            }
            .map-buttons button {
                /*padding: 0.25rem 0.5rem;
                font-size: 1.1em;
                ci dessous test */
                width: 42px;
                height: 42px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                background: #1a6dcc;
                color: white;
                transition: all 0.3s;
                font-size: 1.1rem;                
            }
            .modal-header {
                padding-top: 0.3rem !important;
                padding-bottom: 0.3rem !important;
                min-height: 0 !important;
            }
            .modal-title {
                font-size: 1.1rem !important;
                margin: 0 !important;
                line-height: 1.2 !important;
            }
            .modal-body, #fullmap-modal-body {
                height: 100%;
                min-height: 0;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }         
            fullmap-track {
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 0;
            }   
            .tooltip {
            z-index: 3000 !important;
            }                 
            :host {
                display: block;
            }            
            </style>           
            <div id="map-pm">
                <img id="left-arrow" class="map-arrow-overlay" src="./static/images/left-arrow.png" alt="arrow left" />  
                <img id="right-arrow" class="map-arrow-overlay-right" src="./static/images/right-arrow.png" alt="arrow right" />  
                <div class="map-overlay-bottom">
                    <div id="map-overlay-label" class="map-overlay-label"></div>
                    <div class="map-buttons">
                        <button id="fullmap-btn" 
                            class="btn btn-light btn-sm ms-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Full map">
                            <img src="./static/icons/map-scale.png" style="width: 22px; height: 22px;" />
                        </button>
                        <button id="flyxc-btn" 
                            class="btn btn-light btn-sm ms-2" data-bs-toggle="tooltip" data-bs-placement="top" title="FlyXC">
                            <img src="./static/icons/map-flyxc.png" style="width: 22px; height: 22px;" />
                        </button>
                        <button id="analyze-btn" 
                            class="btn btn-light btn-sm ms-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Analyze">
                            <img src="./static/icons/map-analyze.png" style="width: 22px; height: 22px;" />
                        </button>
                    </div>
                </div>
            </div>   
            <div class="modal fade" id="fullmapModal" tabindex="-1" aria-labelledby="fullmapModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header d-flex align-items-center justify-content-between">
                    <h6 class="modal-title" id="fullmapModalLabel">Carte en plein écran</h6>
                    <div class="d-flex align-items-center gap-2">
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="modal-fullscreen-btn" title="Plein écran">
                            <i class="bi bi-arrows-fullscreen"></i>
                        </button>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    </div>
                  <div class="modal-body" id="fullmap-modal-body">
                    <!-- Ici tu peux mettre une carte Leaflet, une image, etc. 
                    <div id="fullmap-leaflet" style="width:100%;height:90vh;"></div>. -->
                        <fullmap-track></fullmap-track>
                  </div>
                </div>
              </div>
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
        document.getElementById('fullmap-btn').addEventListener('click', () => {
            const btn = document.getElementById('fullmap-btn');
            if (btn) btn.blur();
            this.openFullMapModal();
        });

        document.getElementById('flyxc-btn').addEventListener('click', () => {
            const btn = document.getElementById('flyxc-btn');
            if (btn) btn.blur();
            this.showDownloadInProgress()
        });

        document.getElementById('analyze-btn').addEventListener('click', () => {
            const btn = document.getElementById('analyze-btn');
            if (btn) btn.blur();
            this.restoreOverlayLabel()
        }); 
    }  
    
    rowSelectedHandler = (event) => {
        const rowData = event.detail.rowData;
        this.selectedRowData = rowData;
        this.rowIndex = event.detail.rowIndex;           
        // console.log(`Row index : ${this.rowIndex} - Id_Vol: ${rowData.V_ID} - Engin: ${rowData.V_Engin} - Date: ${rowData.Day} ${rowData.Hour}`);

        this.flightLabel = rowData.Day+' '+rowData.V_Site+' '+rowData.Duree+' '+rowData.V_Engin;
        const overlay = this.querySelector('#map-overlay-label');
        if (overlay) overlay.textContent = this.flightLabel;

        const modalTitle = document.getElementById('fullmapModalLabel');
        if (modalTitle) modalTitle.textContent = this.flightLabel;

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
            this.mapNotrack();
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
    
    mapNotrack() {
        this.cleanMap();
        const latDeco = this.dbFlight.V_LatDeco || 45.863; // A compléter par les setings
        const longDeco = this.dbFlight.V_LongDeco || 6.1725;
        if (this.map) {
            this.map.setView([latDeco, longDeco], 12);
        }
        const takeOffPopUp = this.dbFlight.V_Site+'<br>'+this.dbFlight.V_AltDeco+'m'
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

    async openFullMapModal() {
        if (
            this.dbFlight &&
            this.dbFlight.V_Track &&
            this.dbFlight.V_Track.GeoJSON
        ) {
        const analyzeResult = await this.getIgcAnalyze();
        if (analyzeResult && analyzeResult.success) {
            const elevationData = await this.askElevationData();
            if (elevationData && elevationData.success) {
                analyzeResult.anaTrack.elevations = elevationData.elevations;
                console.log('OpenFullMapModal analyzeResult.anaTrack.elevations', analyzeResult.anaTrack.elevations.length, ' alti');
            } else {
                console.warn('Échec de la récupération des données d\'élévation :', elevationData ? elevationData.message : 'Erreur inconnue');
             }
        } else {
            // Analyse échouée
            console.warn('Analyse IGC échouée :', analyzeResult ? analyzeResult.message : 'Erreur inconnue');
        }
        // Fullmap uniquement si trace disponible
        // Met à jour le titre à l'ouverture
        const modalTitle = document.getElementById('fullmapModalLabel');
        if (modalTitle) {
            // Utilise le dernier flightLabel connu
            modalTitle.textContent = this.selectedRowData
            ? this.selectedRowData.Day + ' ' + this.selectedRowData.V_Site + ' ' + this.selectedRowData.Duree + ' ' + this.selectedRowData.V_Engin
            : '';
        }
        const modalBody = document.getElementById('fullmap-modal-body');
        const fsBtn = document.getElementById('modal-fullscreen-btn');
        if (fsBtn && modalBody) {
        fsBtn.addEventListener('click', () => {
                if (modalBody.requestFullscreen) {
                    modalBody.requestFullscreen();
                } else if (modalBody.webkitRequestFullscreen) { // Safari
                    modalBody.webkitRequestFullscreen();
                }
            });
        }

        // Affiche la modale
        const modal = new bootstrap.Modal(document.getElementById('fullmapModal'));
        modal.show();

        // setTimeout pour laisser le temps à la modale d’être visible avant de mettre à jour la carte
        // leaflet a besoin que le conteneur soit visible pour bien s’initialiser
        setTimeout(() => {
            const fullmapTrack = document.querySelector('fullmap-track');
            if (fullmapTrack) {
                fullmapTrack.i18n = this.i18n;
                fullmapTrack.flightData = this.dbFlight; 
                fullmapTrack.flightAnalyze = analyzeResult.success ? analyzeResult.anaTrack : null;
                if (fullmapTrack.fullmap) {
                    fullmapTrack.fullmap.invalidateSize();
                }
            }
        }, 300); 
        } 
    }

    async getIgcAnalyze() {
        console.log('LogMap - getIgcAnalyze for : ', this.dbFlight.V_Track.fixes.length, ' fixes');
        const params = {
            invoketype: 'igc:analyzing',
            args: {
                fixes : this.dbFlight.V_Track.fixes
            }
        }
        const resAnalyze = await window.electronAPI.invoke(params);                        
        if (resAnalyze.success) {
            return {
                success: true,
                anaTrack: resAnalyze.anatrack
            }
        }
        return {    success: false, message: 'Failed to analyze IGC data' };
    }

    async askElevationData() {
        this.showDownloadInProgress();
        const params = {
            invoketype: 'igc:elevation-data',
            args: {
                fixes : this.dbFlight.V_Track.fixes
            }
        }
        const resElevation = await window.electronAPI.invoke(params);
        this.restoreOverlayLabel();
        if (resElevation.success) {
            console.log('Elevation data received : ', resElevation.elevations.length, ' alti');
            return {                
                success: true,
                elevations: resElevation.elevations
            }
        }
        return {    success: false, message: 'Failed to get elevation data' };
    }   



    showDownloadInProgress() {
        const overlay = this.querySelector('#map-overlay-label');
        if (overlay) {
            const waitingMsg = 'Downloading digital elevation data...';
            overlay.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${waitingMsg}`;
            overlay.style.background = '#d32f2f'; 
        }
    }

    restoreOverlayLabel() {
        const overlay = this.querySelector('#map-overlay-label');
        if (overlay) {
            overlay.textContent = this.flightLabel;
            overlay.style.background = '#1a6dcc'; // couleur d'origine
        }
    }    
    
    destroyTooltips() {
    const tooltips = this.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(el => {
        const instance = bootstrap.Tooltip.getInstance(el);
        if (instance) {
            instance.dispose();
        }
    });
    }

    initTooltips() {
        const tooltipTriggerList = [].slice.call(this.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    setI18n(i18n) {
        this.i18n = i18n;
    }  
}

customElements.define('log-map', LogMap);
