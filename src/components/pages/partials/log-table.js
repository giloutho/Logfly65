// components/app-table.js
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
    this.langLoaded = false;
    this.initialTableLines = 8; // Mémorise le nombre de lignes initial
    this.tableLines = this.initialTableLines; // Nombre de lignes par page
  }

  async connectedCallback() {
    if (!this.langLoaded) {
      await this.langRequest();
      this.langLoaded = true;
    }
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
                          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.gettext('Cancel')}</button>
                          <button type="button" class="btn btn-primary" id="win-validate">${this.gettext('OK')}</button>                        
                      </div>
                  </div>
              </div>
          </div>                
    `;
  }

  setupEventListeners() {
    document.addEventListener('com-updated', this.handleComUpdated);        
    document.addEventListener('glider-updated', this.handleGliderUpdated);   
    document.addEventListener('site-updated', this.handleSiteUpdated); 
    document.addEventListener('flight-deleted', this.handleFlightDeleted); 
    document.addEventListener('select-next-row', this.handleSelectNextRow);      
    document.addEventListener('select-prev-row', this.handleSelectPrevRow);        
  }

  async dbOpen() {
    let dbname = await window.electronAPI.storeGet('dbname');
    if (!dbname) dbname = 'logfly.db';
    console.log('dbname : ' + dbname);
      try {
            const params = {
                invoketype: 'db:open',
                args: { dbname }
            };
            const result = await window.electronAPI.invoke(params);
          if (result.success) {
              console.log(`-> ${result.message}`);  
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
              this.displayTable(resDb.result); // Réinitialise la table DataTable
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
        { "width": "4%", "targets": 0, "bSortable": false },
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
        console.log('Selected rows count: ' + countRows);
        const rowData = dt.row(indexes).data();
        const rowIndex = indexes;
        const dbFlight = await this.readIgc(rowData.V_ID, rowData.V_Engin);
        this.dispatchEvent(new CustomEvent('row-selected', {
          detail: { rowIndex, rowData, dbFlight },
          bubbles: true,
          composed: true
        }));
      }
    });
    this.dataTableInstance.row(':eq(0)').select();
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
          this.displayModal(this.gettext('Decoding problem in track file'),resDb.message);
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
                  this.displayModal(this.gettext('Database update failed'), result.message);
              }
          } catch (error) {
              this.displayModal(this.gettext('Database update failed'), result.message);
          }
        }
      }
    }
    
  displayModal(title, body) {
      const modal = this.querySelector('#winModal');
      const modalTitle = modal.querySelector('#winModalLabel');
      const modalBody = modal.querySelector('#winModalBody');
      modalTitle.textContent = title;
      modalBody.innerHTML = body;
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      const validateBtn = modal.querySelector('#win-validate');
      validateBtn.onclick = () => {
          bsModal.hide();
      };
  }  

  async langRequest() {
    this.i18n = await window.electronAPI.langmsg();
    console.log('Overview -> '+this.i18n['Overview'])
  }  

  gettext(key) {
    return this.i18n[key] || key;
  }  
}

customElements.define("log-table", LogTable);
