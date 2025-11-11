import * as mapMenus from './fullmap-track-menus.js';
import { getLeagueColor, styleAip, findPolygonsAtClick } from './fullmap-track-utils.js';
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
        this._openaipGroup = null;
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
                // Ajoute ici le listener de clic sur la carte
        this.fullmap.on('click', (e) => {
            console.log('clic sur la carte')
            const foundPolygons = findPolygonsAtClick(this._openaipGroup, e.latlng,this.fullmap);
        });
    }

     mapLoadGeoJSON() {
        mapUtils.mapLoadGeoJSON.call(this);
     }

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
        const airspacesBtn = document.getElementById('airspaces-dropdown-btn');
        if (airspacesBtn) {
            airspacesBtn.textContent = this.gettext('Airspaces');
        }

        const scoreBtn = document.getElementById('score-dropdown-btn');
        if (scoreBtn) {
            scoreBtn.textContent = this.gettext('Score');
        }
        const scoreDropdownMenu = document.getElementById('score-dropdown-menu');
        if (scoreDropdownMenu) {
            scoreDropdownMenu.innerHTML = mapMenus.generateScoreMenu(this.gettext.bind(this), this.runXcScore.bind(this));
        }   
        
        const airspacesDropdownMenu = document.getElementById('airspaces-dropdown-menu');
        if (airspacesDropdownMenu) {
            airspacesDropdownMenu.innerHTML = this.generateOpenAipFilter();

            // Ajout des listeners après l'injection du HTML
            const displayLink = airspacesDropdownMenu.querySelector('#display-link-openaip');
            if (displayLink) {
                displayLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.onDisplayOpenAipClicked();
                });
            }

            const checkLinkOpenAip = airspacesDropdownMenu.querySelector('#check-link-openaip');
            if (checkLinkOpenAip) {
                checkLinkOpenAip.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.onCheckOpenAipClicked();
                });
            }

            const checkLinkBazile = airspacesDropdownMenu.querySelector('#check-link-bazile');
            if (checkLinkBazile) {
                checkLinkBazile.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.onCheckBazileClicked();
                });
            }

            const checkLinkFile = airspacesDropdownMenu.querySelector('#aip-check-link-file');
            if (checkLinkFile) {
                checkLinkFile.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.onCheckFileClicked();
                });
            }
        }        
        
    }

    generateInfoSections() {
        return mapMenus.generateInfoSections(this.gettext.bind(this), this._feature, this._flightData, this._flightAnalyze);
    }
    
    generateOpenAipFilter() {
        return mapMenus.generateOpenAipFilter(this.gettext.bind(this));
    } 
    generateChronoSections() {
        return mapMenus.generateChronoSections(this.gettext.bind(this),this._flightAnalyze);
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
            scoreDropdownMenu.innerHTML = mapMenus.generateScoreTable(this.gettext.bind(this), league, textColor, geojson);
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
                        <button id="airspaces-dropdown-btn" class="btn btn-warning dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Airspaces
                        </button>
                        <div class="dropdown-menu p-3" id="airspaces-dropdown-menu" style="max-width:500px; width:500px; font-size:0.75em;">
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
                        scoreDropdownMenu.innerHTML = mapMenusgenerateScoreMenu(this.gettext.bind(this), this.runXcScore.bind(this));
                        this._scoreMenuState = 'menu';
                    }
                    // Sinon, le comportement par défaut (affichage du menu)
                    // Rien à faire ici, le menu est déjà affiché
                });
            }            
                        
        }
    }

    async onDisplayOpenAipClicked() {
        const bloc1Checkboxes = Array.from(document.querySelectorAll('#cbA,#cbB, #cbC, #cbD, #cbE, #cbF, #cbG'))
        .filter(cb => cb.checked)
        .map(cb => cb.value)
        // 'SUA' Special Use Airspace with id 8 is always added
        bloc1Checkboxes.push('8')

        const bloc2Checkboxes = Array.from(document.querySelectorAll('#cbPro, #cbRes, #cbDan, #cbCtr, #cbTma, #cbRmz, #cbTmz, #cbGli, #cbOth'))
        .filter(cb => cb.checked)
        .map(cb => cb.value)

        const checkedRadios = Array.from(document.querySelectorAll('input[type="radio"]:checked'))
        const radioValues = checkedRadios.map(rd => rd.value)

        const values = {
            classes : bloc1Checkboxes,
            types : bloc2Checkboxes,
            floor : radioValues[0],
            radius : radioValues[1]*1000
        }
        const params = {
            invoketype: 'openaip:display',
            args: {
                values: values,
                feature : this._feature,
                filter : true
            }
        }
        const response = await window.electronAPI.invoke(params);                        
        if (response.success) {
            console.log(response.geojson.length+' airspaces loaded from openAIP');
            this.displayOpenAipLayer(response.geojson)
        } else {
            console.log('Error loading openAIP airspaces', response.message);
        }
    }

    displayOpenAipLayer(totalGeoJson) {
        console.log('displayOpenAipLayer', totalGeoJson.length)
        if (this._openaipGroup) {
            this.fullmap.removeLayer(this._openaipGroup);
            if (this._layercontrol) {
                this._layercontrol.removeLayer(this._openaipGroup);
            }
        }
        this._openaipGroup = new L.LayerGroup()
        for (let index = 0; index < totalGeoJson.length; index++) {
            const element = totalGeoJson[index]
            console.log(element.properties.Name+' '+element.properties.Class+' '+element.properties.Floor)
            let airSpace = new L.geoJson(element,{ style: styleAip})
            this._openaipGroup.addLayer(airSpace)
        }  
        this._openaipGroup.addTo(this.fullmap)
    }

    gettext(key) {
        return this._i18n[key] || key;
    }        
}

window.customElements.define('fullmap-track', FullmapTrack);