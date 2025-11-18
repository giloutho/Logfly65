import * as mapMenus from './fullmap-track-menus.js';
import * as mapUtils from './fullmap-track-utils.js';
import * as mapBasics from './fullmap-track-map.js';
import { airSpPopup } from './fullmap-track-popups.js';
import {drawGraphAlti, drawGraphCutting} from './fullmap-track-graph.js';

class FullmapTrack extends HTMLElement {
    constructor() {
        super();
        this._i18n = {} // initialisé par le parent
        this.fullmap = null; 
        this.measureControl = null
        this._flightData = null; 
        this._tableData = null;
        this._feature = null
        this._flightAnalyze = null;
        this._layercontrol = null;
        this._geojsonLayer = null;
        this._thermalLayer = null;
        this._glideLayer = null;
        this._scoreLayer = null;
        this._openaipGroup = null;
        this._checkGroup = null;
        this.startMarker = null; 
        this.endMarker = null; 
        this.hoverMarker = null;
        this.uplot = null;
        this._scoreMenuState = 'menu'; // 'menu' ou 'result'
        this._winSpinner = null;
        this._cuttingAction = false;
        this.highlightedSegment = null;
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
                    height: calc(100% - 180px); /* 150px pour le graph + 30px pour graph-info */
                    min-height: 0;
                    position: relative;
                }
                #graph-info {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.92);
                    font-size: 0.80em;
                    font-weight: 500;
                    color: #333;
                    border-radius: 8px 8px 0 0;
                    border-bottom: 1px solid #bbb;
                    padding: 8px 18px;
                    margin: 0 0 0 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    letter-spacing: 0.02em;
                    text-align: center;
                    transition: background 0.2s;
                }
                #graph {
                    width: 100%;
                    height: 150px;
                    min-height: 80px;
                    max-height: 250px;
                    background: rgba(255,255,255,0.99);
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    border-top: 1px solid #ddd;
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
            <div id="map"></div>
            <div id="graph-info"></div>
            <div id="graph"></div>
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

        document.addEventListener('fullscreenchange', () => {
            const graphDiv = this.querySelector('#graph');
            if (graphDiv) {
                graphDiv.style.width = '100%';
                if (this.uplot) {
                    this.uplot.destroy();
                    // Ajoute un délai pour laisser le DOM recalculer la taille
                    setTimeout(() => {
                        this.mapDrawGraph();
                    }, 50); // 50 ms suffit généralement
                }
            }
            // Optionnel : ajuster la carte Leaflet aussi
            // if (this.fullmap) {
            //     this.fullmap.invalidateSize();
            // }
        });
               
    }

    async initMap() {
        await mapBasics.initMap.call(this);          
        this.initFullmapModalHeader();
    }    

    async setDefaultLayer() {
        await mapBasics.setDefaultLayer.call(this);
    }

    set flightData(value) {
        this._flightData = value;
        this._feature = this._flightData.V_Track.GeoJSON.features[0];
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

    set tableData(value) {      
        this._tableData = value;
       // console.log(`Row index : ${this._tableData.rowIndex} - Id_Vol: ${this._tableData.V_ID} - Engin: ${this._tableData.V_Engin} - Date: ${this._tableData.Day} ${this._tableData.Hour}`);        
    }

    get tableData() {
        return this._tableData;
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
            if ( this._openaipGroup && this.fullmap.hasLayer(this._openaipGroup)) {
                const foundPolygons = mapUtils.findPolygonsAtClick(this._openaipGroup, e.latlng,this.fullmap);
            }
        });
    }
     mapLoadGeoJSON() {
        mapBasics.mapLoadGeoJSON.call(this);
     }

    mapLoadThermals() {
        mapBasics.mapLoadThermals.call(this);
    }

    mapLoadGlides() {
        mapBasics.mapLoadGlides.call(this);
    }

    mapUpdateControls() {
        mapBasics.mapUpdateControls.call(this);
    }

    mapDrawGraph() {
        drawGraphAlti(this);
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

            const checkLinkFile = airspacesDropdownMenu.querySelector('#check-link-file');
            if (checkLinkFile) {
                checkLinkFile.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.onCheckFileClicked();
                });
            }
        }        
        
        const measureBtn = document.getElementById('measure-btn');
        if (measureBtn) {
            measureBtn.textContent = this.gettext('Measure');
        }   

        const cuttingBtn = document.getElementById('cutting-btn');
        if (cuttingBtn) {
            cuttingBtn.textContent = this.gettext('Cutting');
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
            let errorText = 'Error while calculating the score'+'<br><br>';
            errorText += resScoring.error;
            const title = this.gettext('Program error')
            this.winModalDisplay(errorText, title, false, '', 'OK')
        }
    }

    displayScoringResult(context, league, geojson) {  
        const leagueColor = mapUtils.getLeagueColor(league);
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
                        Mesureroi
                    </button>      
                    <button id="cutting-btn" class="btn btn-danger btn-sm" type="button">
                        Découper
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
                    if (this.fullmap && this.measureControl) {
                        this.measureControl._toggleMeasure();
                    }
                });
            }

            const cuttingBtn = modalHeader.querySelector('#cutting-btn');
            if (cuttingBtn) {
                cuttingBtn.addEventListener('click', () => {
                    if (this.fullmap) {
                        if (!this._cuttingAction) {
                            cuttingBtn.classList.add('btn-active');
                            this._cuttingAction = true;
                            this.cutoutTrack();
                        } else {
                            cuttingBtn.classList.remove('btn-active');
                            this._cuttingAction = false;
                            this.cutoutCancel();
                        }
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
            let errorText = 'Error loading openAIP airspaces'+'<br><br>'
            errorText += response.message;   
            const title = this.gettext('Program error')
            this.winModalDisplay(errorText, title, false, '', 'OK')                
        }
    }

    displayOpenAipLayer(totalGeoJson) {
        if (this._openaipGroup) {
            this.fullmap.removeLayer(this._openaipGroup);
            if (this._layercontrol) {
                this._layercontrol.removeLayer(this._openaipGroup);
            }
        }
        this._openaipGroup = new L.LayerGroup()
        for (let index = 0; index < totalGeoJson.length; index++) {
            const element = totalGeoJson[index]
            let airSpace = new L.geoJson(element,{ style: mapUtils.styleAip})
            this._openaipGroup.addLayer(airSpace)
        }  
        this._openaipGroup.addTo(this.fullmap)
        // Ajoute OpenAIP au contrôleur de couches
        if (this._layercontrol) {
            this._layercontrol.addOverlay(this._openaipGroup, this.gettext('OpenAIP'));
        }        
    }

    async onCheckOpenAipClicked() {
        const winText = '<strong>'+this.gettext('Airspaces checking in progress')+'</strong>';
        this.winModalDisplay(winText,'', true, '', this.gettext('Cancel'))
        const defaultFilter = {
            classes : [0,1,2,3,8],
            types : ['3','1','2'],
            floor : this._flightData?.V_Track?.stat.maxalt.gps,
            radius :0
        }        
        const params = {    
            invoketype: 'openaip:check',        
            args: {
                values: defaultFilter,
                feature : this._feature,
                track :  this._flightData.V_Track,
                ground : this._flightAnalyze.elevations
            }
        }
        const checkResult = await window.electronAPI.invoke(params);  
        if (this._winSpinner) {
            this._winSpinner.close();
            this._winSpinner = null;
        }                 
        if (checkResult.success) {
            console.log('OpenAIP incursions found:', checkResult.insidePoints.length); 
            this.displayAirCheck(checkResult,'openaip');         
        } else {
            console.log('Error checking openAIP airspaces', checkResult.message);
            let errorText = 'Error checking openAIP airspaces'+'<br><br>'
            errorText += checkResult.message;   
            const title = this.gettext('Program error')
            this.winModalDisplay(errorText, title, false, '', 'OK')                
        }   
    }

    displayAirCheck(checkResult, origin) {
        if (this._checkGroup) {
            this.fullmap.removeLayer(this._checkGroup);
            if (this._layercontrol) {
                this._layercontrol.removeLayer(this._checkGroup);
            }
        }        
        let nbBadPoints = 0
        let cr = '<br>'
        let report = ''
        let stylePolygon
        if (origin === 'openaip') {
            stylePolygon = mapUtils.styleAip
        } else {
            stylePolygon = mapUtils.styleAirsp
        }

        if (checkResult.insidePoints.length > 0 &&  checkResult.airGeoJson.length > 0) {
            this._checkGroup = new L.FeatureGroup()
            report += '<p><span style="background-color: #F6BB42; color: white;">&nbsp;&nbsp;&nbsp;'
            report += this.gettext('Airspaces involved')+'&nbsp;&nbsp;&nbsp;&nbsp;</span><br>'
            // airspaces GeoJson added to the map 
            for (let index = 0; index < checkResult.airGeoJson.length; index++) {
                const element = checkResult.airGeoJson[index]
                report += element.properties.Name+cr
                const airSpace = L.geoJson(element,{ style: stylePolygon, onEachFeature: airSpPopup })
                this._checkGroup.addLayer(airSpace)
            }
            report += '</p>'
            // Bad points GeoJson
            let badGeoJson = { 
                "type": "Feature", 
                "properties": {
                    "name": "Airspace checking",
                    "desc": ""
                },
                "geometry": 
                    { "type": "MultiPoint", 
                    "coordinates": []
                    } 
            }
            let badCoord = []
            for (let index = 0; index < checkResult.insidePoints.length; index++) {
                nbBadPoints++
                const idxBad = checkResult.insidePoints[index]
                badCoord.push([this._flightData.V_Track.fixes[idxBad].longitude,this._flightData.V_Track.fixes[idxBad].latitude])
            }

            // fin du report
            report += '<p><span style="background-color: #DA4453; color: white;"> &nbsp;&nbsp;&nbsp;'
            report += this.gettext('violation(s)')+' : '+nbBadPoints+' '+this.gettext('points')+'&nbsp;&nbsp;&nbsp;&nbsp;</span></p>'
            report += '<i>'+this.gettext('Click on an airspace to display the description')+'</i>'            

            let badStyle = {
                'color': "#FFFF00",
                'weight': 2,
                'opacity': 1
            }  
            let geojsonMarkerOptions = {
                radius: 3,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }
            badGeoJson.geometry.coordinates = badCoord
            
            const badLayerPoints =  L.geoJson(badGeoJson,{
                style : badStyle,
                pointToLayer: function(f, latlng) {return L.circleMarker(latlng,geojsonMarkerOptions)},
                onEachFeature: function(feature, layer) {layer.bindPopup(report)}.bind(this) // pour accéder à this.gettext si besoin                
            })
            this._checkGroup.addTo(this.fullmap)
            this._checkGroup.addLayer(badLayerPoints)
            this._layercontrol.addOverlay( this._checkGroup, this.gettext('Checking'))
            let center
            if (this._checkGroup && typeof this._checkGroup.getBounds === 'function') {
                const bounds = this._checkGroup.getBounds();
                if (bounds.isValid()) {
                    this.fullmap.fitBounds(bounds);
                    center = bounds.getCenter();
                }            
                const layers = this._checkGroup.getLayers();
                // le premier layer est un airspace concerné pas un point de violation
                const lastLayer = layers[layers.length - 1];        
                if (lastLayer && typeof lastLayer.openPopup === 'function') {
                lastLayer.eachLayer(subLayer => {
                        if (typeof subLayer.openPopup === 'function') {
                            subLayer.openPopup();
                            return false; // stop après le premier
                        }
                    });
                }
            }            
        } else {
            report += '<span style="font-size:16px;background-color: #009900; color: white;">&nbsp;&nbsp;&nbsp;'
            report += this.gettext('No violations in the selected airspace file')
            report += '&nbsp;&nbsp;&nbsp;</span>'
            this._checkGroup = new L.FeatureGroup()
            // checked airspaces GeoJson added to the map 
            for (let index = 0; index < checkResult.airGeoJson.length; index++) {
                console.log('Displaying checked airspace ', index)
                const element = checkResult.airGeoJson[index]
                const airSpace = L.geoJson(element,{ style: mapUtils.styleAirsp, onEachFeature: airSpPopup })
                this._checkGroup.addLayer(airSpace)
                this._checkGroup.addTo(this.fullmap)
                this._layercontrol.addOverlay( this._checkGroup, this.gettext('Checking'))
                this.fullmap.fitBounds(this._checkGroup.getBounds())                
            }
            this.fullmap.openPopup(report, this.fullmap.getCenter(), { maxWidth: 400 });
        }
    } 

    /*
    * A priori on peut utiliser bootstrap 
    * Voir si on peut utiliser le callback pour interrompre la vérification
    */

    async onCheckBazileClicked() {
        const memBazile = await window.electronAPI.storeGet('urlairspace')
        const defBazile = 'http://pascal.bazile.free.fr/paraglidingFolder/divers/GPS/OpenAir-Format/files/LastVers_ff-French-outT.txt'
        let baziUrl    
        if (memBazile != undefined && memBazile != 'undefined' && memBazile != '') {
            baziUrl = memBazile
        } else {
            baziUrl = defBazile
            const setUrl = await window.electronAPI.storeSet('urlairspace', baziUrl)
        } 
        const params = {    
            invoketype: 'file:download',        
            args: {
                dlUrl : baziUrl
            }
        }
        const downloadResult = await window.electronAPI.invoke(params); 
        if (downloadResult.success) {
            console.log(`Fichier téléchargé dans : ${downloadResult.path}`);
            // On ne gère pas un interruption utilisateur dans le download
            const winText = '<strong>'+this.gettext('Airspaces checking in progress')+'</strong>';
            this.winModalDisplay(winText,'', true, '', this.gettext('Cancel'))
            const params = {    
            invoketype: 'openair:check',        
            args: {
                filePath : downloadResult.path,
                track :  this._flightData.V_Track,
                ground : this._flightAnalyze.elevations
                }
            }
            const checkResult = await window.electronAPI.invoke(params);  
   
            if (checkResult.success) {
                if (this._winSpinner) {
                    this._winSpinner.close();
                    this._winSpinner = null;
                }                     
                this.displayAirCheck(checkResult,'openair');         
            } else {
                const params = {    
                    invoketype: 'box:error',        
                    args: {
                        title: this.gettext('Error checking openAir airspaces'),
                        message: checkResult.message || 'Unknown error'
                    } 
                }
                const errorBoxResult = await window.electronAPI.invoke(params);              
            }          
        } else {
            alert(`${this.gettext('Download error')} \n ${downloadResult.message} \n ${this.gettext('Check the URL in settings')}`);
        }                       
    }

    async onCheckFileClicked() {
        const chooseMsg = this.gettext('Choose an openAir file');
        const paramsDialog = {
            invoketype: 'dialog:openfile',
            args: {
                title: chooseMsg,
                message : chooseMsg,
                defaultFolder: 'Logfly',
                buttonLabel: this.gettext('OK'),
                properties: ['openFile'],
                filters: [{ name: 'openAir', extensions: ['txt'] }]
            }
        };
        const chooseOpenFile = await window.electronAPI.invoke(paramsDialog);
        if (chooseOpenFile.canceled || chooseOpenFile.filePaths.length === 0) {
            return;
        }
        const winText = '<strong>'+this.gettext('Airspaces checking in progress')+'</strong>';
        this.winModalDisplay(winText,'', true, '', this.gettext('Cancel'))
        const filePath = chooseOpenFile.filePaths[0];
        const params = {    
            invoketype: 'openair:check',        
            args: {
                filePath : filePath,
                track :  this._flightData.V_Track,
                ground : this._flightAnalyze.elevations
            }
        }
        const checkResult = await window.electronAPI.invoke(params);      
        if (checkResult.success) {
            if (this._winSpinner) {
                this._winSpinner.close();
                this._winSpinner = null;
            }            
            this.displayAirCheck(checkResult,'openair');         
        } else {          
            const params = {    
                invoketype: 'box:error',        
                args: {
                    title: this.gettext('Error checking openAir airspaces'),
                    message: checkResult.message || 'Unknown error'
                } 
            }
            const errorBoxResult = await window.electronAPI.invoke(params);
        }                        
    }   

    cutoutTrack() {
        if (this.fullmap) {
            // Désactive tous les boutons du header
            const infoBtn = document.getElementById('info-dropdown-btn');
            const chronoBtn = document.getElementById('chrono-dropdown-btn');
            const airspacesBtn = document.getElementById('airspaces-dropdown-btn');
            const scoreBtn = document.getElementById('score-dropdown-btn');
            const measureBtn = document.getElementById('measure-btn');
            const cuttingBtn = document.getElementById('cutting-btn');

            if (infoBtn) infoBtn.disabled = true;
            if (chronoBtn) chronoBtn.disabled = true;
            if (airspacesBtn) airspacesBtn.disabled = true;
            if (scoreBtn) scoreBtn.disabled = true;
            if( measureBtn) measureBtn.disabled = true;
            if (cuttingBtn) {
                cuttingBtn.textContent = 'Annuler';
            }            
            drawGraphCutting(this);
        }
    }

    cutoutCancel() {
        if (this.fullmap) {
            // Supprime les marqueurs de découpe s'ils existent
            if (this.startCutMarker) {
                this.fullmap.removeLayer(this.startCutMarker);
                this.startCutMarker = null;
            }
            if (this.endCutMarker) {
                this.fullmap.removeLayer(this.endCutMarker);
                this.endCutMarker = null;
            }      
            if (this.highlightedSegment) {
                this.fullmap.removeLayer(this.highlightedSegment);
                this.highlightedSegment = null;
            }                  
            // Réactive tous les boutons du header
            const infoBtn = document.getElementById('info-dropdown-btn');
            const chronoBtn = document.getElementById('chrono-dropdown-btn');
            const airspacesBtn = document.getElementById('airspaces-dropdown-btn');
            const scoreBtn = document.getElementById('score-dropdown-btn');
            const measureBtn = document.getElementById('measure-btn');
            const cuttingBtn = document.getElementById('cutting-btn');      
            if (infoBtn) infoBtn.disabled = false;
            if (chronoBtn) chronoBtn.disabled = false;
            if (airspacesBtn) airspacesBtn.disabled = false;
            if (scoreBtn) scoreBtn.disabled = false;
            if( measureBtn) measureBtn.disabled = false;
            if (cuttingBtn) {
                cuttingBtn.textContent = this.gettext('Cutting');
            }             
            drawGraphAlti(this);
        }
    }

    async winModalDisplay(winText, title, spinner, cancelText, textOK) {
        const spinnerDiv = '&nbsp;&nbsp;&nbsp;<span id="airsp-spinner" class="spinner-border text-danger" role="status"></span>';
        let winContent = winText;
        if (spinner) {
            winContent += spinnerDiv;
        }
        this._winSpinner = L.control.window(
            map, 
            {
                title: title,
                maxWidth: 400,
                modal: true,
                closeButton: false,
                position: 'center'})
            .prompt({
                buttonOK: textOK || this.gettext('OK'),
                callback : async () => { 
                    console.log('Airspace checking interrupted by user');
                    window.electronAPI.send('openair:interrupt');
                },
                buttonCancel: cancelText,
            })
            .content(winContent);
        this._winSpinner.show();
    }
    
    gettext(key) {
        return this._i18n[key] || key;
    }        
}

window.customElements.define('fullmap-track', FullmapTrack);