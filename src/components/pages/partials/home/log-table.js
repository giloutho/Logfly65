export class LogTable extends HTMLElement {
  setTableLines(lines) {
    if (lines === 'reset') {
      this.tableLines = this.initialTableLines || 8;
    } else {
      this.tableLines = lines;
    }
    if (this.dataTableInstance) {
      this.dataTableInstance.page.len(this.tableLines).draw();
    }
  }
  constructor() {
    super();
    this.dataTableInstance = null;
    this.i18n = {}; // Pour stocker les messages
    this.initialTableLines = 8; // Mémorise le nombre de lignes initial
    this.tableLines = this.initialTableLines; // Nombre de lignes par page
  }

  async connectedCallback() {
    this.render();
    this.dbOpen(); // Ouverture de la base de données 
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = /*html */`
          <table id="table_id" class="table table-striped table-bordered">
              <tbody>
              </tbody>
          </table>
          <div id="msg-toast" class="toast align-items-center text-bg-success border-0 position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="2000">
            <div class="d-flex">
              <div class="toast-body" id="toast-txt">
                toast message
              </div>
            </div>
          </div>          
          <div class="modal fade" id="winModal" tabindex="-1" aria-labelledby="winModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                  <div class="modal-content">
                      <div class="modal-header">
                          <h5 class="modal-title" id="winModalLabel">Win title</h5>
                          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div class="modal-body">
                          <p id="winModalBody"></p>
                      </div>
                      <div class="modal-footer">
                          <button type="button" class="btn btn-primary" id="win-validate">${this.gettext('OK')}</button>                        
                      </div>
                  </div>
              </div>
          </div>  
          <!-- ajoute une modale dédiée à l'affichage photo  -->
          <div class="modal fade" id="photoModal" tabindex="-1" data-bs-backdrop="true">
            <div class="modal-dialog" style="max-width:none; margin:0;">
              <div class="modal-content" style="background:transparent !important; border:none !important; box-shadow:none !important;">
                <div class="modal-body" style="padding:0 !important; background:transparent !important;">
                  <img id="photoModalImg" src="" style="display:block; border-radius:8px;" />
                </div>
                <button type="button" class="btn-close btn-close-white position-absolute" style="top:10px; right:10px; z-index:1060;" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
            </div>
          </div>           
    `;
  }

  setupEventListeners() {
    document.addEventListener('com-updated', this.handleComUpdated);        
    document.addEventListener('glider-updated', this.handleGliderUpdated);   
    document.addEventListener('site-updated', this.handleSiteUpdated); 
    document.addEventListener('photo-selected', this.handlePhotoSelected);
    document.addEventListener('flight-deleted', this.handleFlightDeleted); 
    document.addEventListener('track-cut-confirmed', this.handleCuttingTrack); 
    document.addEventListener('select-next-row', this.handleSelectNextRow);      
    document.addEventListener('select-prev-row', this.handleSelectPrevRow);        
  }

  async dbOpen() {
    let dbname = await window.electronAPI.storeGet('dbName');
    if (!dbname) dbname = 'logfly.db';
      try {
            const params = {
                invoketype: 'db:open',
                args: { dbname }
            };
            const result = await window.electronAPI.invoke(params);
          if (result.success) {
              this.dbTable();
          } else {
              console.error(`\n-> ${result.message}`);
          }
      } catch (err) {
          console.error('Erreur lors de l\'ouverture de la base de données:', err);
      }        
  }
  
  async dbTable() {
      let reqSQL = 'SELECT V_ID, strftime(\'%d-%m-%Y\',V_date) AS Day, strftime(\'%H:%M\',V_date) AS Hour, replace(V_sDuree,\'mn\',\'\') AS Duree, V_Site, V_Engin, V_Commentaire, V_Duree, V_Tag,'
      reqSQL += 'CASE WHEN (V_Photos IS NOT NULL AND V_Photos !=\'\') THEN \'Yes\' END Photo '  
      reqSQL += 'FROM Vol ORDER BY V_Date DESC'
      try {
          const params = {
              invoketype: 'db:query',
              args: { sqlquery: reqSQL }
          };
          const resDb = await window.electronAPI.invoke(params);
          if (resDb.success) {
              // Debugging
              // resDb.result.forEach((row, idx) => {
              //     console.log(`Résultat ${idx + 1}:`, row.Day, row.Duree);
              // });
              if (resDb.result.length === 0) {
                this.displayNoFlights();
              } else {
                this.displayTable(resDb.result); // Réinitialise la table DataTable
              }
          } else {
              console.error(`\n-> Erreur requête : ${resDb.message}`);
          }
      } catch (err) {
          console.error('Erreur lors de l\'exécution de la requête:', err);
      }
  }    

  displayTable(dbFlights) {
    const table = this.querySelector('#table_id');
    // Détruire l'ancienne instance DataTable si elle existe
    if (this.dataTableInstance) {
      this.dataTableInstance.destroy();
      this.dataTableInstance = null;
    }
    const tableLines = this.tableLines;
    const dataTableOptions = {
      data: dbFlights,
      autoWidth: false,
      columns: [
        {
          title: '',
          data: 'Photo',
          render: function(data) {
            if (data == 'Yes') {
              return '<img src="./static/images/Camera.png" alt="" width="12px" height="12px">&nbsp;<span></img>';
            }
            return data;
          },
          className: "dt-body-center text-center"
        },
        {
          title: '',
          data: 'V_Tag',
          render: function(data) {
            switch (data) {
              case 1: return '<img src="./static/images/tag_red.png" alt="" width="10px" height="10px"></img>';
              case 2: return '<img src="./static/images/tag_orange.png" alt="" width="10px" height="10px"></img>';
              case 3: return '<img src="./static/images/tag_gold.png" alt="" width="10px" height="10px"></img>';
              case 4: return '<img src="./static/images/tag_lime.png" alt="" width="10px" height="10px"></img>';
              case 5: return '<img src="./static/images/tag_blue.png" alt="" width="10px" height="10px"></img>';
            }
            return data;
          },
          className: "dt-body-center text-center"
        },
        { title: this.gettext('Date'), data: 'Day' },
        { title: '', data: 'Hour' },
        { title: this.gettext('Duration').substring(0,3), data: 'Duree' },
        { title: 'Site', data: 'V_Site' },
        { title: this.gettext('Glider'), data: 'V_Engin' },
        { title: 'Comment', data: 'V_Commentaire' },
        { title: 'Id', data: 'V_ID' },
        { title: 'Seconds', data: 'V_Duree' }
      ],
      columnDefs: [
        { "width": "7%", "targets": 0, "bSortable": false },
        { "width": "2%", "targets": 1, "bSortable": false },
        { "width": "17%", "targets": 2 },
        { "width": "7%", "targets": 3 },
        { "width": "8%", "targets": 4 },
        { "width": "30%", className: "text-nowrap", "targets": 5 },
        { "width": "24%", "targets": 6 },
        { "targets": 7, "visible": false, "searchable": false },
        { "targets": 8, "visible": false, "searchable": false },
        { "targets": 9, "visible": false, "searchable": false }
      ],
      bInfo: false,
      lengthChange: false,
      ordering: false,
      pageLength: tableLines,
      pagingType: 'full',
      dom: 'lrtip',
      language: {
        paginate: {
          first: '<<',
          last: '>>',
          next: '>',
          previous: '<'
        }
      },
      select: true,
      createdRow: function(row, data) {
        if (data['V_Commentaire']) {
          row.classList.add('table-warning');
        }
      }
    };

    // Créer la nouvelle instance DataTable
    this.dataTableInstance = new window.DataTable(table, dataTableOptions);

    this.dataTableInstance.on('select', async (e, dt, type, indexes) => {
      if (type === 'row') {
        let countRows = this.dataTableInstance.rows({ selected: true }).count();
        // console.log('Selected rows count: ' + countRows);
        const rowData = dt.row(indexes).data();
        const rowIndex = indexes;
        const dbFlight = await this.readIgc(rowData.V_ID, rowData.V_Engin);
        this.dispatchEvent(new CustomEvent('row-selected', {
          detail: { rowIndex, rowData, dbFlight },
          bubbles: true,
          composed: true
        }));
        // Affichage auto 
        // Pose problème si on clique sur l'icône photo
        // il y aura deux affichages de la photo
        // Pour l'instant plus d'affichaage auto
        // const isPhoto = dt.row(indexes).data().Photo
        // if (isPhoto === 'Yes') {  
        //   console.log('Photos for flight Id: ' + rowData.V_ID);
        //   this.displayPhoto(rowData.V_ID);
        //   // this.dispatchEvent(new CustomEvent('show-photos', {   
        //   //   detail: { flightId: rowData.V_ID },
        //   // }));
        //   } 
      }
    });
    this.dataTableInstance.row(':eq(0)').select();

    // *** To select the first row at each page change ***
    // Ce code qui provenait de L6 ne fonctionne pas. Pas d'erreur
    //  mais la première ligne de la nouvelle page n'est pas sélectionnée
    // this.dataTableInstance.on( 'page.dt', () => {
    //   const info = this.dataTableInstance.page.info()
    //   console.log( 'Showing page: '+info.page+' of '+info.pages )
    //   this.dataTableInstance.row(':eq(0)', { page: 'current' }).select()
    // })
    //Le problème vient du timing de sélection de la première ligne après un changement de page.
    // L’événement 'page.dt' est déclenché avant que la nouvelle page soit complètement affichée, 
    // donc la sélection ne s’applique pas toujours correctement.
    // l’événement 'draw' est déclenché APRES le rendu de la nouvelle page.
    this.dataTableInstance.on('draw', () => {
      // Désélectionne toutes les lignes
      this.dataTableInstance.rows().deselect();
      // Sélectionne la première ligne de la page courante
      this.dataTableInstance.row(':eq(0)', { page: 'current' }).select();
    });

    // // Click on the first column dedicated to the management of the photo of the day
    // this.dataTableInstance.on('click', 'tbody td:first-child', () => {  
    //   let data = table.row( $(this).parents('tr') ).data()
    //   let rowIndex = $(this).parents('tr').index()
    //   if (data['Photo']=== 'Yes') this.displayPhoto(data['V_ID'])
    // })

    const tableEl = this.querySelector('#table_id');
    tableEl.addEventListener('click', (event) => {
        const cell = event.target.closest('td');
        if (!cell) return;
        // Vérifie si c'est la première colonne
        if (cell.cellIndex === 0) {
            event.stopPropagation(); // Empêche la désélection
            const row = cell.parentElement;
            // Utilise DataTables pour récupérer la ligne à partir de l'élément DOM
            const rowData = this.dataTableInstance.row(row).data();
            if (rowData && rowData.Photo === 'Yes') {
                this.displayPhoto(rowData.V_ID);
                // Sélectionne la ligne si elle ne l'est pas déjà
                this.dataTableInstance.row(row).select();
            }
        }
    });
  }

    handleSelectNextRow = () => {
        console.log('handleSelectNextRow called');
        if (!this.dataTableInstance) return;
        const selectedIndexes = this.dataTableInstance.rows({ selected: true }).indexes().toArray();
        if (selectedIndexes.length === 0) return;
        let nextIndex = selectedIndexes[0] + 1;
        const rowCount = this.dataTableInstance.rows().count();
        const tableLines = this.tableLines;

        // Si on arrive en bas de page, passe à la page suivante
        if (nextIndex >= rowCount) {
            nextIndex = 0;
            this.dataTableInstance.page('first').draw('page');
        } else if ((nextIndex % tableLines) === 0) {
            // Si on arrive en bas de la page, passe à la page suivante
            const currentPage = this.dataTableInstance.page();
            const pageCount = this.dataTableInstance.page.info().pages;
            if (currentPage < pageCount - 1) {
                this.dataTableInstance.page(currentPage + 1).draw('page');
            } else {
                this.dataTableInstance.page('first').draw('page');
                nextIndex = 0;
            }
        }

        // Déselectionne toutes les lignes
        this.dataTableInstance.rows().deselect();

        // Sélectionne la nouvelle ligne
        this.dataTableInstance.row(':eq(' + nextIndex + ')').select()
        // l'index sélectionné et les données seront envoyées à LogMap avec l'évènement select 
        // défini dans la table -> this.dataTableInstance.on('select', (e, dt, type, indexes) 
    };    

    handleSelectPrevRow = () => {
        if (!this.dataTableInstance) return;
        const selectedIndexes = this.dataTableInstance.rows({ selected: true }).indexes().toArray();
        if (selectedIndexes.length === 0) return;

        let prevIndex = selectedIndexes[0] - 1;
        const tableLines = this.tableLines || 8;
        const rowCount = this.dataTableInstance.rows().count();

        // Si on est au tout début de la table, ne rien faire
        if (prevIndex < 0) return;

        // Si on est au début d'une page, passer à la page précédente et sélectionner la dernière ligne
        if ((selectedIndexes[0] % tableLines) === 0) {
            const currentPage = this.dataTableInstance.page();
            if (currentPage > 0) {
                this.dataTableInstance.page(currentPage - 1).draw('page');
                prevIndex = (currentPage - 1) * tableLines + (tableLines - 1);
            }
        }

        // Déselectionne toutes les lignes
        this.dataTableInstance.rows().deselect();

        // Sélectionne la nouvelle ligne
        this.dataTableInstance.row(':eq(' + prevIndex + ')').select();
        // l'index sélectionné et les données seront envoyées à LogMap avec l'évènement select 
        // défini dans la table -> this.dataTableInstance.on('select', (e, dt, type, indexes) 
    };    


  async readIgc(flightId, dbGlider) {
      const resDb = await this.readIgcFromDb(flightId);
      if (resDb.success) {
          const dbFlight = { ...resDb.dbData };            
          // if (dbFlight.V_Track && dbFlight.V_Track !== null) {
          //    this.displayModal('Décodage OK', `Voile : ${dbGlider} <br> Points : ${dbFlight.V_Track.fixes.length}. UTC Offset : ${dbFlight.V_Track.info.offsetUTC}mn`);
          // } else {
          //     this.displayModal('Décodage OK', `Voile : ${dbGlider} <br> Pas de trace pour ce vol.`);         
          // }
          return dbFlight
      } else {
          this.displayModal('error', this.gettext('Decoding problem in track file'),resDb.message);
      }
  }

    async readIgcFromDb(flightId) {
      const reqSQL =`SELECT V_IGC, V_LatDeco, V_LongDeco, V_AltDeco, V_Site FROM Vol WHERE V_ID = ${flightId}`;
      try {
          const params = {
              invoketype: 'db:query',
              args: { sqlquery: reqSQL }
          };
          const resDb = await window.electronAPI.invoke(params);
          if (resDb.success && resDb.result && resDb.result.length > 0) {
              if (resDb.result[0].V_IGC == null || resDb.result[0].V_IGC == '') {
                  return {
                      success: true,
                      dbData : { 
                                  V_Track : null,
                                  V_LatDeco: resDb.result[0].V_LatDeco,
                                  V_LongDeco: resDb.result[0].V_LongDeco,
                                  V_AltDeco: resDb.result[0].V_AltDeco,
                                  V_Site: resDb.result[0].V_Site
                              }
                  }
              } else {
                  const params = {
                      invoketype: 'igc:decoding',
                      args: {
                          strIgc : resDb.result[0].V_IGC
                      }
                  }
                  const track = await window.electronAPI.invoke(params);                        
                  if (track.success) {
                      return {
                          success: true,
                          dbData : { 
                                      V_Track : track.data,
                                      V_LatDeco: resDb.result[0].V_LatDeco,
                                      V_LongDeco: resDb.result[0].V_LongDeco,
                                      V_AltDeco: resDb.result[0].V_AltDeco,
                                      V_Site: resDb.result[0].V_Site
                                  }
                      }
                  }
                  return {    success: false, message: 'Failed to read IGC data' };
              }
          } else {
              return {
                  success: false,
                  message: resDb.message || 'No data found with readIgcFromDb',}            
          }                
      } catch (err) {
          return {
              success: false,
              message: err.message || 'Error executing readIgcFromDb',
          }
      }         
    }  

    handleComUpdated = async (event) => {
      const { rowIndex,V_ID, V_Commentaire } = event.detail;
      console.log('row-updated : ' + V_ID + ' ' + V_Commentaire);
      // Met à jour la base de données via IPC
      const params = {
          invoketype: 'db:update',
          args: {
              sqltable: 'Vol',
              sqlparams: {
                  V_Commentaire: V_Commentaire
              },
              sqlwhere: {
                  V_ID: V_ID
              }
          }
      };
      const result = await window.electronAPI.invoke(params);
      if (result.success) {
        // Met à jour la ligne concernée dans la DataTable avec rowIndex fourni
        if (this.dataTableInstance && typeof rowIndex !== 'undefined') {
          const rowData = this.dataTableInstance.row(rowIndex).data();
          rowData.V_Commentaire = V_Commentaire;
          const node = this.dataTableInstance.row(rowIndex).node();
          if (node) {
            if (V_Commentaire && V_Commentaire !== '') {
              console.log('add table-warning');
              node.classList.add('table-warning');
            } else {
              console.log('remove table-warning');
              node.classList.remove('table-warning');
            }
          }
          this.dataTableInstance.row(rowIndex).data(rowData).draw(false);
        }
        // Affiche le toast
        const toastEl = document.getElementById('msg-toast');
        if (toastEl) {
          const toastBody = toastEl.querySelector('#toast-txt');
          if (toastBody) {
          toastBody.textContent = this.gettext('Saved changes');
          }
          const toast = new bootstrap.Toast(toastEl);
          toast.show();
        }
      } else {
        console.error('Erreur lors de la mise à jour :', result.message);
      }
    }      
  
    handleGliderUpdated = async (event) => {
      const { V_Engin } = event.detail;
      let rows = this.dataTableInstance.rows('.selected');
      const selectedRowsData = rows.data().toArray();
      console.log('multi-updated : ' + V_Engin + ' ' + selectedRowsData.length + ' lignes à modifier');

      for (const rowData of selectedRowsData) {
          try {
              const flightId = rowData.V_ID;
              const params = {
                  invoketype: 'db:update',
                  args: {
                      sqltable: 'Vol',
                      sqlparams: {
                          V_Engin: V_Engin
                      },
                      sqlwhere: {
                          V_ID: flightId
                      }
                  }
              };
              const result = await window.electronAPI.invoke(params);
              if (result.success) {
                  // Met à jour la cellule dans la table affichée
                  const rowIdx = this.dataTableInstance.row(function(idx, data) {
                      return data.V_ID === flightId;
                  }).index();
                  if (rowIdx !== undefined) {
                      this.dataTableInstance.cell({row: rowIdx, column: 6}).data(V_Engin);
                  }
              } else {
                  console.error('Erreur lors de la mise à jour :', result.message);
              }
          } catch (error) {
              console.error('Error during flight update ' + error);
          }
      }
    }  
    
    handleSiteUpdated = async (event) => {
        const siteUpdate = event.detail;
        let rows = this.dataTableInstance.rows('.selected');
        const selectedRowsData = rows.data().toArray();
        console.log('multi-updated : ' + siteUpdate.V_Site + ' ' + selectedRowsData.length + ' lignes à modifier');
        let args =  {
                        sqltable: 'Vol',
                        sqlparams: null,
                        sqlwhere: null
                    }
        if (siteUpdate.V_LatDeco == null && siteUpdate.V_LongDeco == null) {
            args.sqlparams = { V_Site : siteUpdate.V_Site}
        } else {
            args.sqlparams = { 
                V_Site: siteUpdate.V_Site,
                V_LatDeco: siteUpdate.V_LatDeco,
                V_LongDeco: siteUpdate.V_LongDeco,
                V_AltDeco: siteUpdate.V_AltDeco,
                V_Pays: siteUpdate.V_Pays
            }
        }
      for (const rowData of selectedRowsData) {
          try {
              const flightId = rowData.V_ID;
              args.sqlwhere = { V_ID: flightId };               
              const params = {
                  invoketype: 'db:update', args: args
              };
              const result = await window.electronAPI.invoke(params);
              if (result.success) {
                  // Met à jour la cellule dans la table affichée
                  const rowIdx = this.dataTableInstance.row(function(idx, data) {
                      return data.V_ID === flightId;
                  }).index();
                  if (rowIdx !== undefined) {
                      this.dataTableInstance.cell({row: rowIdx, column: 5}).data(siteUpdate.V_Site);
                  }
              } else {
                  console.error('Erreur lors de la mise à jour :', result.message);
              }
          } catch (error) {
              console.error('Error during flight update ' + error);
          }
      }
    }         
    
    handlePhotoSelected = async (event) => {
      // Récupère le buffer base64 et le nom du fichier
        const { base64, flightId, rowIndex } = event.detail;
        // Pour obtenir un buffer binaire à partir du base64 :
        const base64Data = base64.split(',')[1]; // retire le préfixe data:image/jpeg;base64,
        const photoBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        // Utilise photoBuffer pour l'enregistrement en base
        console.log('Photo buffer:', photoBuffer);
        console.log('flight Id: ' + flightId + ' rowIndex: ' + rowIndex);
        const reqSQL = `UPDATE Vol SET V_Photos= '${base64Data}' WHERE V_ID = ${flightId}`;
        try {
            const params = {
                invoketype: 'db:query',
                args: { sqlquery: reqSQL }
            };
            const resDb = await window.electronAPI.invoke(params);
            if (resDb.success) {   
              console.log('Photo enregistrée en base pour le vol Id: ' + flightId);
              // Met à jour la cellule dans la table affichée
              if (this.dataTableInstance && typeof rowIndex !== 'undefined') {
                const rowData = this.dataTableInstance.row(rowIndex).data();
                rowData.Photo = 'Yes';
                this.dataTableInstance.row(rowIndex).data(rowData).draw(false);
              }
            } else {
                console.error(`\n-> Erreur requête : ${resDb.message}`);
            }
        } catch (err) {
            console.error('Erreur lors de l\'exécution de la requête:', err);
        }
    }    

    handleFlightDeleted = async (event) => {
      const { rowIndex,V_ID } = event.detail;
      if (this.dataTableInstance) {
        if (rowIndex !== undefined) {
          // Supprsession de la base de données via IPC
          try {
              const params = {
                  invoketype: 'db:delete',
                  args: {
                      sqltable: 'Vol',
                      sqlwhere: {
                          V_ID: V_ID
                      }
                  }
              };
              const result = await window.electronAPI.invoke(params);
              if (result.success) {
                // Supprime la ligne de la DataTable
                this.dataTableInstance.row(rowIndex).remove().draw(false);
                // Sélectionne la première ligne si elle existe
                if (this.dataTableInstance.rows().count() > 0) {
                  this.dataTableInstance.row(':eq(0)').select();
                }
              } else {
                  this.displayModal('error', this.gettext('Database update failed'), result.message);
              }
          } catch (error) {
              this.displayModal('error', this.gettext('Database update failed'), result.message);
          }
        }
      }
    }

    handleCuttingTrack = async (event) => {
      const { rowIndex, flightID, newIgc } = event.detail;
      console.log('Track cut réussi pour le vol ID : ' + flightID+' à la ligne index : '+rowIndex);
    //  console.log(newIgc.substring(0, 100));
      // Décodage la trace IGC raccourcie
      const params = {
          invoketype: 'igc:decoding',
          args: {
              strIgc : newIgc
          }
      }
      const track = await window.electronAPI.invoke(params);                        
      if (track.success) {
          console.log(`Nouveau track décodé avec ${track.data.fixes.length} points.`);
          const updateResult = await this.updateCuttingTrackInDb(flightID, track.data);
          if (updateResult.success) {           
              const rowData = this.dataTableInstance.row(rowIndex).data();
              // Relecture de la trace pour mise à jour de la carte
              const dbFlight = await this.readIgc(flightID, null);
              this.dispatchEvent(new CustomEvent('row-selected', {
                  detail: { rowIndex, rowData, dbFlight },
                  bubbles: true,
                  composed: true
              }));              
              this.displayModal('success', this.gettext('Successful operation'), this.gettext('The flight track has been successfully cut and updated in the logbook'));
          } else {
              this.displayModal('error', this.gettext('Logbook update failed'), updateResult.message);
          }
      } else {
          this.displayModal('error', this.gettext('Decoding problem in track file'), track.message);
      } 
    }

    async updateCuttingTrackInDb(flightID, track) {
        console.log('Debugging updateCuttingTrackInDb...');
        const dateObj = new Date(track.info.isodate);
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        let hours = String(dateObj.getUTCHours()).padStart(2, '0');
        let minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
        const pDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // "2022-03-22 15:59:29"
        const tableDate = `${day}-${month}-${year}`;
        const tableTime = `${hours}:${minutes}`;
        console.log('Flight date (UTC):', pDate);
        let totalSeconds = track.stat.duration
        hours = Math.floor(totalSeconds / 3600)
        totalSeconds %= 3600
        minutes = Math.floor(totalSeconds / 60)
        const pSduree = String(hours).padStart(2, "0")+'h'+String(minutes).padStart(2, "0")+'mn' // V_sDuree
        console.log('Flight duration V_Duree : ',track.stat.duration,' V_sDuree :', pSduree);
        const pLatDeco = track.fixes[0].latitude;  // V_LatDeco 
        const pLongDeco = track.fixes[0].longitude;  // V_LongDeco
        const pAltDeco = track.fixes[0].gpsAltitude;  // V_AltDeco
        console.log('Takeoff position :', pLatDeco, pLongDeco, pAltDeco);
        const pUTC = track.info.offsetUTC
        console.log(pUTC)      
        console.log(track.igcData.substring(0, 100));
        const params = {
            invoketype: 'db:update',
            args: {
                sqltable: 'Vol',
                sqlparams: {
                    V_Date : pDate, 
                    V_Duree : totalSeconds, 
                    V_sDuree : pSduree, 
                    V_LatDeco : pLatDeco, 
                    V_LongDeco : pLongDeco, 
                    V_AltDeco : pAltDeco,
                    V_IGC: track.igcData
                },
                sqlwhere: {
                    V_ID: flightID
                }
            }
        };
        const result = await window.electronAPI.invoke(params);
        if (result.success) {
            console.log('Database updated successfully for flight ID:', flightID);
          // Met à jour la cellule dans la table affichée
          const rowIdx = this.dataTableInstance.row(function(idx, data) {
                                                      return data.V_ID === flightID;
                                                    }).index();
          if (rowIdx !== undefined) {
                this.dataTableInstance.cell({row: rowIdx, column: 2}).data(tableDate);
                this.dataTableInstance.cell({row: rowIdx, column: 3}).data(tableTime);
                this.dataTableInstance.cell({row: rowIdx, column: 4}).data(pSduree);
          }
          return { success: true, rowIdx };
        } else {
            console.error('Error updating database for flight ID:', flightID, result.message);
            return { success: false, message: result.message };
        }
    }

    async displayPhoto(flightId) {
      const reqSQL = `SELECT V_Photos FROM Vol WHERE V_ID = ${flightId}`;
      try {
          const params = {
              invoketype: 'db:query',
              args: { sqlquery: reqSQL }
          };
          const resDb = await window.electronAPI.invoke(params);
          if (resDb.success) {   
            if (resDb.result.length > 0) {
              const strImage = resDb.result[0].V_Photos;
              // Utilise le bon type MIME selon ton stockage (ici png ou jpg)
              const src = 'data:image/jpeg;base64,' + strImage;

              // Charge l'image dans la modale Bootstrap dédiée
              const photoModal = this.querySelector('#photoModal');
              const photoModalImg = this.querySelector('#photoModalImg');
              if (photoModal && photoModalImg) {
                photoModalImg.onload = function() {
                    const imgWidth = photoModalImg.naturalWidth;
                    const imgHeight = photoModalImg.naturalHeight;
                    
                    const maxWidth = window.innerWidth * 0.95;
                    const maxHeight = window.innerHeight * 0.95;
                    
                    let finalWidth = imgWidth;
                    let finalHeight = imgHeight;
                    
                    if (finalWidth > maxWidth) {
                        finalHeight = (maxWidth / finalWidth) * finalHeight;
                        finalWidth = maxWidth;
                    }
                    if (finalHeight > maxHeight) {
                        finalWidth = (maxHeight / finalHeight) * finalWidth;
                        finalHeight = maxHeight;
                    }
                    
                    const dialog = photoModal.querySelector('.modal-dialog');
                    const content = photoModal.querySelector('.modal-content');
                    const body = photoModal.querySelector('.modal-body');
                    
                    if (dialog && content && body) {
                        // Centre la modale et ajuste sa taille
                        dialog.style.position = 'fixed';
                        dialog.style.top = '50%';
                        dialog.style.left = '50%';
                        dialog.style.transform = 'translate(-50%, -50%)';
                        dialog.style.width = finalWidth + 'px';
                        dialog.style.height = finalHeight + 'px';
                        dialog.style.maxWidth = 'none';
                        dialog.style.margin = '0';
                        
                        content.style.width = finalWidth + 'px';
                        content.style.height = finalHeight + 'px';
                        content.style.background = 'transparent';
                        content.style.border = 'none';
                        content.style.boxShadow = 'none';
                        
                        body.style.padding = '0';
                        body.style.width = finalWidth + 'px';
                        body.style.height = finalHeight + 'px';
                        body.style.background = 'transparent';
                        
                        photoModalImg.style.width = finalWidth + 'px';
                        photoModalImg.style.height = finalHeight + 'px';
                        photoModalImg.style.objectFit = 'contain';
                        photoModalImg.style.display = 'block';
                    }
                    
                    // Rend le backdrop semi-transparent (fond sombre autour de l'image)
                    setTimeout(() => {
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.style.backgroundColor = 'rgba(0,0,0,0.1)';                       
                        }
                    }, 50);
                };
                photoModalImg.src = src;
                // Affiche la modale Bootstrap
                const bsModal = window.bootstrap.Modal.getOrCreateInstance(photoModal);
                bsModal.show();
                        }
            }
          } else {
              console.error(`\n-> Erreur requête : ${resDb.message}`);
          }
      } catch (err) {
          console.error('Erreur lors de l\'exécution de la requête:', err);
      }
    }

    async displayNoFlights() {
      // log-table ne voit pas la div #right-panel
      // il faut donc émettre un évènement vers home-page pour mettre à jour la partie droite
      // log-map écoute aussi cet évènement pour afficher une carte par défaut
      let defLat = await window.electronAPI.storeGet('finderlat');
      let defLong = await window.electronAPI.storeGet('finderlong');
      if (!defLat) defLat = 45.863;
      if (!defLong) defLong = 6.1725;
      const mapMsg = this.gettext('No track to display');
      let panelMsg = `<p>${this.gettext('There are no flights in the logbook')}</p>`;
      panelMsg += `<p>${this.gettext('To add flights, use the import function')}. `;
      panelMsg += `<img src="./static/icons/mnu-import.png" alt="Import" style="width:1.7rem;height:1.7rem;vertical-align:middle;" /></p>`; // Ajout de l'image ici
      this.dispatchEvent(new CustomEvent('no-flights', { detail: { panelMsg, mapMsg, defLat, defLong }, bubbles: true, composed: true }));
    }
    
    displayModal(typeTitle, title, body) {
        const modal = this.querySelector('#winModal');
        const modalTitle = modal.querySelector('#winModalLabel');
        const modalBody = modal.querySelector('#winModalBody');
        // Choix de la couleur selon typeTitle
        let color = '#1976d2'; // bleu par défaut
        if (typeTitle === 'success') color = '#388e3c'; // vert
        if (typeTitle === 'error') color = '#d32f2f';   // rouge
        // Met en valeur le titre
        modalTitle.innerHTML = `<span style="font-weight:bold; color:${color}; font-size:1.1em;">${title}</span>`;
        // Affiche le body en caractères plus gros avec un margin top
        modalBody.innerHTML = `<span style="font-size:1.25em; margin-top:10px; margin-left:10px; display:block;">${body}</span>`;
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        const validateBtn = modal.querySelector('#win-validate');
        validateBtn.onclick = () => {
            bsModal.hide();
        };
    }  

    gettext(key) {
      return this.i18n[key] || key;
    }  
}

customElements.define("log-table", LogTable);
