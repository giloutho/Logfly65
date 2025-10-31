class FullmapTrack extends HTMLElement {
    constructor() {
        super();
        this.fullmap = null; 
        this._flightData = null; 
        this._flightAnalyze = null;
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
            <div id="map">
                <!-- La carte Leaflet sera rendue ici -->
            </div>
        `;
    }

    setupEventListeners(){
        // Écouteur d'événements ou autres configurations si nécessaire
    }

    initMap() {
        // Initialiser la carte en la centrant sur Genève
        // ************ à modifier sur settings ************
        this.fullmap = L.map('map').setView([46.2044, 6.1432], 13);
        
        // Ajouter la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.fullmap);
    }    

    set flightData(value) {
        this._flightData = value;
        // flightData contient l'objet vol complet
        // {V_Track: {…}, V_Track est le résultat d'igcDecoding
        // V_LatDeco: 45.85326666666667, 
        // V_LongDeco: 6.222916666666666, 
        // V_AltDeco: 956, 
        // V_Site: 'PLANFAIT'}        
        // Ici tu peux déclencher un rendu ou une mise à jour de la carte
        this.updateMap();
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
        if (!this._dbFlight) return;
        // Utilise this._dbFlight pour afficher la trace, etc.
      //  alert(this._dbFlight.V_Track.info.date);
        
      }
}

window.customElements.define('fullmap-track', FullmapTrack);