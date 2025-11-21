export function drawGraphAlti(context) {
    // Ici, 'context' est l'instance de FullmapTrack (this)        
    const arrayAlti = context._feature['geometry']['coordinates'].map(coord => coord[2]);
    const arraySol = context._flightAnalyze && context._flightAnalyze.elevations
        ? context._flightAnalyze.elevations
        : [];
    // times contained in the GeoJSon are only strings
    // conversion to date object is necessary for Highcharts.dateFormat to work on the x axis
    const arrayHour = context._feature['properties']['coordTimes'].map(hour => new Date(hour));
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

    const graphDiv = context.querySelector('#graph');
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
            ],
            select: {
                show: false
            }
        };
        const data = [x, y1, y2.length ? y2 : new Array(y1.length).fill(null)];
        context.uplot = new uPlot(options, data, graphDiv);

        const graphInfoDiv = context.querySelector('#graph-info');
        if (graphInfoDiv) {
            graphInfoDiv.textContent = ''; // vide au départ
        }

        // Affichage dynamique de l'info au survol
        context.uplot.root.addEventListener('mousemove', e => {
            const idx = context.uplot.cursor.idx;
            if (idx != null && idx >= 0 && idx < x.length) {
                const heure = arrayHour[idx];
                const alt = y1[idx];
                const sol = y2[idx];
                const hground = sol !== undefined && sol !== null ? (alt - sol).toFixed(0) : 'N/A';
                // console.log(context._flightData.V_Track.vz[idx].toFixed(2)+'m/s  '+context._flightData.V_Track.speed[idx].toFixed(0)+' km/h')
                graphInfoDiv.innerHTML =
                    `<span style="color:#1a6dcc;font-weight:bold;">🕒 ${heure.getUTCHours().toString().padStart(2, '0')}:${heure.getUTCMinutes().toString().padStart(2, '0')}</span>
                    &nbsp;|&nbsp;
                    <span style="color:#1976d2;">⛰️ ${alt} m</span>
                    &nbsp;|&nbsp;
                    <span style="color:Sienna;">🟫 ${sol} m</span>
                    &nbsp;|&nbsp;
                    <span style="color:#6d4c41;">↕️ ${hground} m</span>
                    &nbsp;|&nbsp;
                    <span style="color:#388e3c;">⬇️ ${context._flightData.V_Track.vz[idx].toFixed(2)} m/s</span>
                    &nbsp;|&nbsp;
                    <span style="color:#e65100;">➡️ ${context._flightData.V_Track.speed[idx].toFixed(0)} km/h</span>`;
                // Récupère la position correspondante dans le GeoJSON
                const coords = context._feature.geometry.coordinates;
                const coord = coords[idx];
                if (coord) {
                    const latlng = [coord[1], coord[0]]; // [lat, lng]
                    // Supprime l'ancien marker de survol s'il existe
                    if (context.hoverMarker) {
                        context.fullmap.removeLayer(context.hoverMarker);
                    }
                    // Ajoute un nouveau marker (ou déplace l'existant)
                    context.hoverMarker = L.circleMarker(latlng, {
                        radius: 7,
                        color: 'orange',
                        fillColor: 'yellow',
                        fillOpacity: 0.8,
                        weight: 2
                    }).addTo(context.fullmap);
                }
            }
        });

        // Ajoute un événement au clic sur le graphe
        context.uplot.root.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = context.uplot.cursor.idx;
            if (idx != null && idx >= 0 && idx < x.length) {
                // Récupère la position correspondante dans le GeoJSON
                const coords = context._feature.geometry.coordinates;
                const coord = coords[idx];
                if (coord) {
                    const latlng = [coord[1], coord[0]]; // [lat, lng]
                    // Supprime l'ancien marker de survol s'il existe
                    if (context.hoverMarker) {
                        context.fullmap.removeLayer(context.hoverMarker);
                    }
                    // Ajoute un nouveau marker (ou déplace l'existant)
                    context.hoverMarker = L.circleMarker(latlng, {
                        radius: 7,
                        color: 'orange',
                        fillColor: 'yellow',
                        fillOpacity: 0.8,
                        weight: 2
                    }).addTo(context.fullmap);
                    context.fullmap.setZoom(15);
                    context.fullmap.panTo(context.hoverMarker.getLatLng())
                }



                // // Par exemple, tu peux déclencher une action ou un événement personnalisé
                // const heure = arrayHour[idx];
                // const alt = y1[idx];
                // const sol = y2[idx];
                // console.log('Clic sur le graph à l’index', idx, 'Heure:', heure, 'Altitude:', alt, 'Sol:', sol);

                // // Exemple : émettre un événement personnalisé
                // context.dispatchEvent(new CustomEvent('graph-click', {
                //     detail: { idx, heure, alt, sol }
                // }));
            }
        });
    }    
}

export function drawGraphCutting(context) {
    // Détruit l'instance uPlot précédente si elle existe
    if (context.uplot) {
        context.uplot.destroy();
        context.uplot = null;
    }

    const arrayAlti = context._feature['geometry']['coordinates'].map(coord => coord[2]);
    const arrayHour = context._feature['properties']['coordTimes'].map(hour => new Date(hour));
    const x = arrayHour.map(date => date.getTime());
    const y1 = arrayAlti;

    const graphDiv = context.querySelector('#graph');
    if (graphDiv) {
        graphDiv.innerHTML = "";
        const options = {
            width: graphDiv.offsetWidth || 600,
            height: 150,
            series: [
                {},
                { label: "Altitude", stroke: "blue", width: 2 }
            ],
            axes: [
                {
                    values: (u, ticks) => ticks.map(ts => {
                        const d = new Date(ts);
                        return d.getUTCHours().toString().padStart(2, '0') + ':' + d.getUTCMinutes().toString().padStart(2, '0');
                    }),
                },
                { label: "Altitude (m)" }
            ],
            select: {
                show: true
            },
            hooks: {
                setSelect: [
                    (u) => {
                        if (u.select.width > 0) {
                            // Sauvegarde la sélection
                            const selectLeft = u.select.left;
                            const selectWidth = u.select.width;
                            
                            // Récupère les valeurs min et max de la sélection (timestamps)
                            const minX = u.posToVal(selectLeft, "x");
                            const maxX = u.posToVal(selectLeft + selectWidth, "x");
                            
                            // Convertit une valeur de données en index du tableau
                            const idx0 = u.valToIdx(minX);
                            let idx1 = u.valToIdx(maxX);
                            
                            // Correction : idx1 ne doit pas dépasser le dernier index
                            idx1 = Math.min(idx1, context._flightData.V_Track.fixes.length - 1);
                            
                            plotCutMarkers(context, idx0, idx1);
                            
                            // // Réapplique la sélection pour qu'elle reste visible
                            // setTimeout(() => {
                            //     console.log('Réapplique la sélection sur le graphe :', { left: selectLeft, width: selectWidth });   
                            //     u.setSelect({ left: selectLeft, width: selectWidth, show: true });
                            // }, 0);             
                        }
                    }
                ]
            }            
        };
        const data = [x, y1];
        context.uplot = new uPlot(options, data, graphDiv);

        const graphInfoDiv = context.querySelector('#graph-info');
        if (graphInfoDiv) {
            graphInfoDiv.textContent = '';
        }

        // Affichage dynamique de l'info au survol
        context.uplot.root.addEventListener('mousemove', e => {
            const idx = context.uplot.cursor.idx;
            if (idx != null && idx >= 0 && idx < x.length) {
                const heure = arrayHour[idx];
                const alt = y1[idx];
                graphInfoDiv.innerHTML =
                    `<span style="color:#1a6dcc;font-weight:bold;">🕒 ${heure.getUTCHours().toString().padStart(2, '0')}:${heure.getUTCMinutes().toString().padStart(2, '0')}</span>
                    &nbsp;|&nbsp;
                    <span style="color:#1976d2;">⛰️ ${alt} m</span>`;
                // Marker sur la carte
                const coords = context._feature.geometry.coordinates;
                const coord = coords[idx];
                if (coord) {
                    const latlng = [coord[1], coord[0]];
                    if (context.hoverMarker) {
                        context.fullmap.removeLayer(context.hoverMarker);
                    }
                    context.hoverMarker = L.circleMarker(latlng, {
                        radius: 7,
                        color: 'orange',
                        fillColor: 'yellow',
                        fillOpacity: 0.8,
                        weight: 2
                    }).addTo(context.fullmap);
                }
            }
        });
    }
}

async function plotCutMarkers(context, idx0, idx1) {
    const fixes = context._flightData.V_Track.fixes;
    // from https://github.com/pointhi/leaflet-color-markers
    const purpleIcon = new L.Icon({
            iconUrl: './static/images/marker-icon-violet.png',
            shadowUrl: './static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
    });
    const goldIcon = new L.Icon({
            iconUrl: './static/images/marker-icon-gold.png',
            shadowUrl: './static/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
    });    
    // Marqueur début
    if (fixes[idx0]) {
        const latlng0 = [fixes[idx0].latitude, fixes[idx0].longitude];
        if (context.startCutMarker) {
            context.fullmap.removeLayer(context.startCutMarker);
        }
        context.startCutMarker = L.marker(latlng0, { icon: purpleIcon }).addTo(context.fullmap);
    }
    // Marqueur fin
    if (fixes[idx1]) {
        const latlng1 = [fixes[idx1].latitude, fixes[idx1].longitude];
        if (context.endCutMarker) {
            context.fullmap.removeLayer(context.endCutMarker);
        }
        context.endCutMarker = L.marker(latlng1, { icon: goldIcon }).addTo(context.fullmap);
    }

    // Supprime l'ancien surlignage si présent
    if (context.highlightedSegment) {
        context.fullmap.removeLayer(context.highlightedSegment);
        context.highlightedSegment = null;
    }

    // Récupère les coordonnées du segment sélectionné
    const segmentCoords = fixes.slice(idx0, idx1 + 1).map(fix => [fix.latitude, fix.longitude]);

    // Crée une polyline pour surligner le segment
    context.highlightedSegment = L.polyline(segmentCoords, {
        color: 'orange',
        weight: 6,
        opacity: 0.8,
        dashArray: '8,6'
    }).addTo(context.fullmap);

    // Affiche le menu déroulant de confirmation
    const cutDropdownMenu = document.getElementById('cut-dropdown-menu');
    const cutDropdownBtn = document.getElementById('cut-dropdown-btn');
    if (cutDropdownBtn && cutDropdownMenu) {
        // Crée une instance Bootstrap Dropdown sur le bouton
        const bsDropdown = window.bootstrap?.Dropdown.getOrCreateInstance(cutDropdownBtn);
        bsDropdown.show();
    }
    // Désactive le bouton de démarrage de la sélection
    const startCutBtn = document.getElementById('start-cut-btn');
    if (startCutBtn) {
        startCutBtn.disabled = true;
    }
    // Active le bouton de confirmation
    const confirmCutBtn = document.getElementById('confirm-cut-btn');
    if (confirmCutBtn) {
        confirmCutBtn.disabled = false;
        confirmCutBtn.onclick = async () => {
            // Fenêtre de confirmation
            let winText = context.gettext('The retained part will be between the two markers') + '\n\n';
            winText += context.gettext('Are you sure you want to continue') + ' ?';
            const params = {
                invoketype: 'box:confirmation',
                args: {
                    title: context.gettext('Cutting track confirmation'),
                    message: winText,
                    buttons: [context.gettext('Oui'), context.gettext('Non')],
                    defaultId: 0,
                    cancelId: 1
                }
            };
            const confirmationResult = await window.electronAPI.invoke(params);
            if (confirmationResult.success && confirmationResult.response === 0) {
                
                // Fermer la fenêtre modale
                if (typeof context.closeWinModal === 'function') {
                    console.log('Fermeture de la modale après confirmation de la découpe');
                    context.closeWinModal();
                } 
                // remettre à zéro les outils de découpe
                if (typeof context.cutoutCancel === 'function') {
                    context.cutoutCancel();
                }
                context.dispatchEvent(new CustomEvent('track-cut-confirmed', {
                    detail: { idx0, idx1 }
                }));
            } else {
                console.log('User cancelled the cut action');
            }
        };
    }    



    //Alert(this.gettext('Clic on Confirm to cut the track between the two markers.'));

    // // fenêtre confirmation
    // // const winTitle = context.gettext('Cutting track confirmation');
    // // let winText = context.gettext('The retained part will be between the two markers.')+'<br><br>'
    // // winText += context.gettext('Are you sure you want to continue')+' ?'; 
    // // context.winModalDisplay(winText,winTitle, false, context.gettext('Cancel'), context.gettext('Confirm'))
    // let winText = context.gettext('The retained part will be between the two markers')+'\n\n'
    // winText += context.gettext('Are you sure you want to continue')+' ?'; 
    // const params = {    
    //     invoketype: 'box:confirmation',        
    //     args: {
    //         title: context.gettext('Cutting track confirmation'),
    //         message: winText,
    //         buttons: [context.gettext('Oui'), context.gettext('Non')],
    //         defaultId: 0,
    //         cancelId: 1
    //     } 
    // }
    // const confirmationResult = await window.electronAPI.invoke(params);
    // if (confirmationResult.success && confirmationResult.response === 0) {
    //         context.dispatchEvent(new CustomEvent('track-cut-confirmed', {
    //         detail: { idx0, idx1 }
    //     }));
    //     // Fermer la fenêtre modale
    //     console.log('on ferme la modale');
    //     if (typeof context.closeWinModal === 'function') {
    //         context.closeWinModal();
    //     }        
    // } else {
    //     console.log('User cancelled the cut action');
    // }    
}
