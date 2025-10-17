class MapPreview extends HTMLElement {
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

    initMap() {
        const mapDiv = this.querySelector('#map');
        if (!this.map) {
            this.map = L.map(mapDiv).setView([45.863, 6.1725], 9);  // Centrage Annecy
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
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    }

    displayTrack(trackGeojson) {
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

window.customElements.define('map-preview', MapPreview);