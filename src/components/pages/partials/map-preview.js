class MapPreview extends HTMLElement {
    constructor() {
        super();
        this.map = null;
    }

    connectedCallback() {
        this.innerHTML = /*html */`
            <style>
                :host {
                    display: block;
                    height: 400px;  /* Hauteur explicite */
                }
                /* Hauteur à ajuster si modal-header devient plus grand */
                .modal-body, map-preview, #map {
                    height: 85vh !important;
                    min-height: 85vh !important;
                }
            </style>
            <div id="map"></div>
        `;        
    }

    showMap() {
        const mapDiv = this.querySelector('#map');
    //     console.log('mapDiv size:', mapDiv.offsetWidth, mapDiv.offsetHeight);
    //         // Si la hauteur est 0, retente plus tard
    // if (mapDiv.offsetHeight === 0) {
    //     setTimeout(() => this.showMap(), 100);
    //     return;
    // }
        if (!this.map) {
            this.map = L.map(mapDiv).setView([45.5, 6.5], 9);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        }
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    }

    displayFlight(igcData) {
        if (this.map) {
            // Nettoyer la carte
            this.map.eachLayer((layer) => {
                if (layer instanceof L.Polyline) {
                    this.map.removeLayer(layer);
                }
            });
            // Afficher le vol
            // TODO: Parser igcData et créer polyline
        }
    }    


}

window.customElements.define('map-preview', MapPreview);