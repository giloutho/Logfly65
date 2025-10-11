import "./map-preview.js";

class ImpTable extends HTMLElement {
// import DataTable from 'datatables.net-bs5';
// import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
// const trigo = require('../../../js/geo/trigo.js'); 


    constructor() {
        super();
        this.dataTableInstance = null; // Ajout pour stocker l'instance DataTable
        this.i18n = {} // Pour stocker les messages
        this.langLoaded = false;
        this.currentGpsLib = null; // GPSDump, SeeYou, XCSoar ...
        this.typeGps = null;
    }

    async connectedCallback() {
        if (!this.langLoaded) {
        await this.langRequest();
        this.langLoaded = true;
        }
        this.render();
        this.setupEventListeners();
    }

    render() {
    this.innerHTML = /*html */`  
                <style>
                    .importred, .importred td {
                    background-color: #FFA07A !important;
                    }
                    .importgreen, .importgreen td {
                    background-color: #5F9EA0  !important;
                    }
                </style>
                <div class="alert alert-info d-none" id='importmenu' role="alert" style="margin-top: 10px">
                    Display import options
                </div>
                <div id="accordionDiv"> 
                    <div id="div_table" style="display:none">
                      <div id="table-content">
                          <!-- Cette table servira à TOUS les imports : disk, usb et serie -->
                          <table id="tableimp" class="table table-striped table-bordered d-none" style="width:100%;font-size:1.25em;">
                          <tbody></tbody>
                          </table>
                      </div>
                    </div>
                </div>  
                <!-- Modal -->
                <div class="modal fade" id="mapModal" tabindex="-1" aria-labelledby="mapModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-fullscreen">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="mapModalLabel">${this.gettext('Flight preview')}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" style="height:400px; min-height:400px;">
                                <map-preview></map-preview>
                            </div>
                        </div>
                    </div>
                </div>                   
    `;
    }

    async langRequest() {
      this.i18n = await window.electronAPI.langmsg();
      console.log('Overview -> '+this.i18n['Overview'])
    }

    setupEventListeners() {
        document.querySelector('import-page').addEventListener('usb-import', (event) => {
            const importData = event.detail.importData;
            this.currentGpsLib = importData.libGps; // GPSDump, SeeYou, XCSoar ...
            this.typeGps = importData.typeGps; // disk, usb, serial
            this.showUsbMenu(importData);
            this.displayUsbTable(importData.flights);
        });        
        document.querySelector('import-page').addEventListener('serial-import', (event) => {
            const importData = event.detail.importData;
            this.currentGpsLib = importData.libGps; // GPSDump, SeeYou, XCSoar ...
            this.typeGps = importData.typeGps; // disk, usb, serial
            this.showSerialMenu(importData);
            this.displaySerialTable(importData.flights);
        });           
    }

    async showUsbMenu(importData) {
        // Calcule le nom de vol à importer  toInsert = true
        let totInsert = 0;
        for (const flight of importData.flights) {
            if (flight.toInsert == true) totInsert++;
        }
        let uncheckedButton = '<button type="button" class="btn btn-outline-success mr-4" style="margin-right: 10px" id="bt-unselect">'+this.gettext('Unselect')+'</button>'
        let statusData = `${importData.libGps} : ${importData.flights.length} ${this.gettext('tracks decoded')}`
        statusData += '&nbsp;&nbsp;<strong>[&nbsp;'+this.gettext('Tracks to be added')+'&nbsp;:&nbsp;'
        statusData += `<span id="tracksToBeAdded">${totInsert}</span>`
        statusData += '&nbsp;]</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        let updateButton = '<button type="button" class="btn btn-danger btn-xs mr-2" id="bt-update">'+this.gettext('Logbook update')+'</button>'
        const menuElement = this.querySelector('#importmenu');
        menuElement.innerHTML = uncheckedButton+statusData+updateButton;
        menuElement.classList.remove('d-none');
        // Ajoute l'écouteur JS natif
        const unselectBtn = this.querySelector('#bt-unselect');
        if (unselectBtn) {
            unselectBtn.addEventListener('click', () => {
                this.uncheckTable();
            });
        }
        const updateBtn = this.querySelector('#bt-update');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateLogbook());
        }
    }

    async showSerialMenu(importData) {
        // Calcule le nom de vol à importer  toInsert = true
        let totInsert = 0;
        for (const flight of importData.flights) {
            if (flight.new == true) totInsert++;
        }
        let uncheckedButton = '<button type="button" class="btn btn-outline-success mr-4" style="margin-right: 10px" id="bt-unselect">'+this.gettext('Unselect')+'</button>'
        let statusData = `${importData.libGps} : ${importData.flights.length} ${this.gettext('tracks in GPS')}`
        statusData += '&nbsp;&nbsp;<strong>[&nbsp;'+this.gettext('Tracks to be added')+'&nbsp;:&nbsp;'
        statusData += `<span id="tracksToBeAdded">${totInsert}</span>`
        statusData += '&nbsp;]</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        let updateButton = '<button type="button" class="btn btn-danger btn-xs mr-2" id="bt-update">'+this.gettext('Logbook update')+'</button>'
        const menuElement = this.querySelector('#importmenu');
        menuElement.innerHTML = uncheckedButton+statusData+updateButton;
        menuElement.classList.remove('d-none');
        // Ajoute l'écouteur JS natif
        const unselectBtn = this.querySelector('#bt-unselect');
        if (unselectBtn) {
            unselectBtn.addEventListener('click', () => {
                this.uncheckTable();
            });
        }
        const updateBtn = this.querySelector('#bt-update');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateLogbook());
        }
    }    
 
    displayUsbTable(flights) {
      const divTable = this.querySelector('#div_table');
      if (divTable) divTable.style.display = '';
      const table = this.querySelector('#tableimp');
      // Détruire l'ancienne instance DataTable si elle existe (ES6)
      if (this.dataTableInstance) {
          this.dataTableInstance.destroy();
          this.dataTableInstance = null;
      }
      //   this.attachCheckClic()
      //  currTypeGps = 'disk'. A voir si necessaire fait la difféfrence avec GPSDump dans L6
      let colorRed
      const dataTableOptions = {
        // width format see this http://live.datatables.net/zurecuzi/1/edit
        autoWidth: false,
        data: flights, 
        columns: [  
          {
            // display boolean as checkbox -> http://live.datatables.net/kovegexo/1/edit
            title : this.gettext('Logbook'),
            data: 'toInsert',
            width: '5%',
            render: function(data, type, row) {
              if (data === true && row.newflight === true) {
                return '<input type="checkbox" name="chkbx" class="editor-active" checked >';
              } else if (data === false && row.newflight === true) {
                return '<input type="checkbox" name="chkbx" class="editor-active">';
              } else {
                return '<img class="importgreen" src="./static/images/in_logbook.png" alt=""></img>';
              }
              return data;
            },
            className: "dt-body-center text-center"
          },      
          { 
            title : this.gettext('Date'), 
            data: 'date', width: '10%',
          },
          { title : this.gettext('Time'), data: 'startTime', width: '8%'},
          { title : this.gettext('File name') , data: 'file'},
          { title : this.gettext('Pilot name') , data: 'pilot'},        
          { title : this.gettext('Path') , data: 'path'},
        {
          title : '',
          data: 'toInsert',
          width: '8%',
          render: (data, type, row) =>{
            // action on the click is described below
            return `<button type="button" class="btn btn-warning btn-sm">${this.gettext('Map')}</button>`;
          },
          className: "dt-body-center text-center"
        },         
      ],       
      columnDefs : [
        { "targets": [ 5 ], "visible": false, "searchable": false}, // cache la colonne path
      ],         
      // change color according cell value -> http://live.datatables.net/tohehohe/1/edit
      'createdRow': function( row, data, dataIndex ) {
        if ( data['newflight'] === true ) {               
          row.classList.add('importred');
        } else {
          row.classList.add('importgreen');
        }
      },  
      destroy: true,
      bInfo : false,          // hide "Showing 1 to ...  row selected"
      lengthChange : false,   // hide "show x lines"  end user's ability to change the paging display length 
      searching : false,      // hide search abilities in table
      ordering: false,        // Sinon la table est triée et écrase le tri sql
      pageLength: 10,         // ce sera à calculer avec la hauteur de la fenêtre
      pagingType : 'full',
      language: {             // cf https://datatables.net/examples/advanced_init/language_file.html
        paginate: {
          first: '<<',
          last: '>>',
          next: '>', // or '→'
          previous: '<' // or '←' 
        }
      },     
      select: true             // Activation du plugin select
      }
      this.dataTableInstance = new DataTable(table, dataTableOptions);
      table.addEventListener('click', async(event) => {
        const target = event.target;
        if (
            target.tagName === 'INPUT' &&
            target.type === 'checkbox' &&
            target.name === 'chkbx'
        ) {
            const row = target.closest('tr');
            const rowIndex = Array.from(table.rows).indexOf(row);

            // Récupère les données de la ligne via DataTable
            const dtRow = this.dataTableInstance.row(row).data();

            // Met à jour la propriété toInsert selon l'état de la checkbox
            dtRow.toInsert = target.checked;
            this.updateInsertCountStatus();
            // Récupère les données de la ligne (selon ta logique DataTable)
            // Exemple si tu utilises DataTable :
            // let dtRow = this.dataTableInstance.row(row).data();
            // console.log('rowindex', rowIndex);
            // const igcString = dtRow.igcFile;
            // displayOneFlight(igcString, 9999);

            // Si tu utilises un tableau flights :
            // const igcString = flights[rowIndex].igcFile;
            // displayOneFlight(igcString, 9999);

            // Adapte selon ta structure de données
        } else if (target.classList.contains('btn-warning')) {  // Si c'est le bouton Map
            const row = target.closest('tr');
            const rowIndex = Array.from(table.rows).indexOf(row);
            const rowData = this.dataTableInstance.row(row).data();
            const pathIgc = rowData.path;
            const params = {
                invoketype: 'igc:reading',
                args: {
                    igcPath : pathIgc
                }
            }
            const track = await window.electronAPI.invoke(params);  
            if (track.success) {
              if (track.data.GeoJSON) {
                console.log(track.data.fixes.length+' points in track GeoJSON Ok...');
              }
              // Initialise et affiche la modale
              const mapModal = new bootstrap.Modal(this.querySelector('#mapModal'));
              // Attendre que la modale soit complètement ouverte
              mapModal._element.addEventListener('shown.bs.modal', () => {
                const previewMap = this.querySelector('map-preview');
                if (previewMap) {
                  previewMap.initMap(); // Appelle la méthode qui initialise la carte      
                  previewMap.displayTrack(track.data.GeoJSON);            ;              
                }   
              }, { once: true });
              mapModal.show(); 
          }                  
        }
      });
    // example from https://datatables.net/examples/ajax/null_data_source.html
    // code bouton carte
    // $('#tableimp').on( 'click', 'button', function () {
    //   //$('#tableimp').off( 'click' )
    //   let dtRow = table.row( $(this).parents('tr') ).data();
    //   let rowIndex = table.row( $(this).parents('tr') ).index()
    //   // alert( 'Index '+rowIndex+'   '+dtRow['date']+"' ' "+dtRow['path']);
    //   // code original
    //   // displayOneFlight(dtRow['path'], 9999)
    //   console.log('rowindex '+rowIndex)
    // // console.log({dtRow})
    //   // nouveau code
    // // const igcString = igcForImport[rowIndex].igcFile    
    //   const igcString = dtRow.igcFile  
    //   displayOneFlight(igcString, 9999)
    // } );     
      table.classList.remove('d-none');     
    }    

   displaySerialTable(flights) {
      const divTable = this.querySelector('#div_table');
      if (divTable) divTable.style.display = '';
      const table = this.querySelector('#tableimp');
      // Détruire l'ancienne instance DataTable si elle existe (ES6)
      if (this.dataTableInstance) {
          this.dataTableInstance.destroy();
          this.dataTableInstance = null;
      }
      //   this.attachCheckClic()
      //  currTypeGps = 'disk'. A voir si necessaire fait la difféfrence avec GPSDump dans L6
      let colorRed
      const dataTableOptions = {
        // width format see this http://live.datatables.net/zurecuzi/1/edit
        autoWidth: false,
        data: flights, 
        columns: [  
          {
            // display boolean as checkbox -> http://live.datatables.net/kovegexo/1/edit
            title : this.gettext('Logbook'),
            data: 'new',
            width: '5%',
            render: function(data, type, row) {
                      if (data === true) {
                        return '<input type="checkbox" name="chkbx" class="editor-active" checked >';
                      } else {
                        //   return '<input type="checkbox" class="editor-active">';
                        return '<img src="../../assets/img/in_logbook.png" alt=""></img>';
                      }
              return data;
            },
            className: "dt-body-center text-center"
          },      
          { title : this.gettext('date'), data: 'date', width: '10%'},
          { title : this.gettext('Time'), data: 'takeoff', width: '8%'},
          { title : this.gettext('Duration') , data: 'duration'},        
          { title : 'Pilot name', data: null},    //unused in this table version  
          {
            title : '',
            data: 'new',
            width: '8%',
            render: (data, type, row) =>{
              // action on the click is described below
              return `<button type="button" class="btn btn-warning btn-sm">${this.gettext('Map')}</button>`;
            },
            className: "dt-body-center text-center"
          },  
          { title : 'Path' , data: 'gpsdump'}       
        ],       
        columnDefs : [
            {
              "targets": [ 4 ],           // 'Pilot name' column is hidden
              "visible": false,
              "searchable": false
            },      
            {
                "targets": [ 6 ],           // 'Path' column is hidden
                "visible": false,
                "searchable": false
            },
        ],         
      // change color according cell value -> http://live.datatables.net/tohehohe/1/edit
      'createdRow': function( row, data, dataIndex ) {
        if ( data['new'] === true ) {               
          row.classList.add('importred');
        } else {
          row.classList.add('importgreen');
        }
      },  
      destroy: true,
      bInfo : false,          // hide "Showing 1 to ...  row selected"
      lengthChange : false,   // hide "show x lines"  end user's ability to change the paging display length 
      searching : false,      // hide search abilities in table
      ordering: false,        // Sinon la table est triée et écrase le tri sql
      pageLength: 10,         // ce sera à calculer avec la hauteur de la fenêtre
      pagingType : 'full',
      language: {             // cf https://datatables.net/examples/advanced_init/language_file.html
        paginate: {
          first: '<<',
          last: '>>',
          next: '>', // or '→'
          previous: '<' // or '←' 
        }
      },     
      select: true             // Activation du plugin select
      }
      this.dataTableInstance = new DataTable(table, dataTableOptions);
      table.addEventListener('click', async(event) => {
        const target = event.target;
        if (
            target.tagName === 'INPUT' &&
            target.type === 'checkbox' &&
            target.name === 'chkbx'
        ) {
            const row = target.closest('tr');
            const rowIndex = Array.from(table.rows).indexOf(row);

            // Récupère les données de la ligne via DataTable
            const dtRow = this.dataTableInstance.row(row).data();

            // Met à jour la propriété toInsert selon l'état de la checkbox
            dtRow.toInsert = target.checked;
            this.updateInsertCountStatus();
            // Récupère les données de la ligne (selon ta logique DataTable)
            // Exemple si tu utilises DataTable :
            // let dtRow = this.dataTableInstance.row(row).data();
            // console.log('rowindex', rowIndex);
            // const igcString = dtRow.igcFile;
            // displayOneFlight(igcString, 9999);

            // Si tu utilises un tableau flights :
            // const igcString = flights[rowIndex].igcFile;
            // displayOneFlight(igcString, 9999);

            // Adapte selon ta structure de données
        } else if (target.classList.contains('btn-warning')) {  // Si c'est le bouton Map
            const row = target.closest('tr');
            const rowIndex = Array.from(table.rows).indexOf(row);
            const rowData = this.dataTableInstance.row(row).data();
            const pathIgc = rowData.path;
            const params = {
                invoketype: 'igc:reading',
                args: {
                    igcPath : pathIgc
                }
            }
            const track = await window.electronAPI.invoke(params);  
            if (track.success) {
              if (track.data.GeoJSON) {
                console.log(track.data.fixes.length+' points in track GeoJSON Ok...');
              }
              // Initialise et affiche la modale
              const mapModal = new bootstrap.Modal(this.querySelector('#mapModal'));
              // Attendre que la modale soit complètement ouverte
              mapModal._element.addEventListener('shown.bs.modal', () => {
                const previewMap = this.querySelector('map-preview');
                if (previewMap) {
                  previewMap.initMap(); // Appelle la méthode qui initialise la carte      
                  previewMap.displayTrack(track.data.GeoJSON);            ;              
                }   
              }, { once: true });
              mapModal.show(); 
          }                  
        }
      });
    // example from https://datatables.net/examples/ajax/null_data_source.html
    // code bouton carte
    // $('#tableimp').on( 'click', 'button', function () {
    //   //$('#tableimp').off( 'click' )
    //   let dtRow = table.row( $(this).parents('tr') ).data();
    //   let rowIndex = table.row( $(this).parents('tr') ).index()
    //   // alert( 'Index '+rowIndex+'   '+dtRow['date']+"' ' "+dtRow['path']);
    //   // code original
    //   // displayOneFlight(dtRow['path'], 9999)
    //   console.log('rowindex '+rowIndex)
    // // console.log({dtRow})
    //   // nouveau code
    // // const igcString = igcForImport[rowIndex].igcFile    
    //   const igcString = dtRow.igcFile  
    //   displayOneFlight(igcString, 9999)
    // } );     
      table.classList.remove('d-none');     
    }    


  uncheckTable() {
    // Parcourt toutes les données, toutes pages confondues
    this.dataTableInstance.rows().every(function(rowIdx, tableLoop, rowLoop) {
      // Met à jour la propriété toInsert dans les données
      const rowData = this.data();
      if (rowData && rowData.toInsert === true) {
        rowData.toInsert = false;
      }
      // Si la ligne est affichée, décoche la case
      const rowNode = this.node();
      if (rowNode) {
        const checkbox = rowNode.querySelector('input[type="checkbox"][name="chkbx"]');
        if (checkbox) {
          checkbox.checked = false;
        }
      }
    });
    this.updateInsertCountStatus();
  }

  updateInsertCountStatus() {
    let count = 0;
    this.dataTableInstance.rows().data().toArray().forEach(row => {
      if (row.toInsert === true) {
        count++;
      }
    });
    const tracksSpan = this.querySelector('#tracksToBeAdded');
    if (tracksSpan) {
      tracksSpan.textContent = count; 
    }
    const updateBtn = this.querySelector('#bt-update');
    if (updateBtn) {
      if (count === 0) {
        updateBtn.disabled = true;
      } else {
        updateBtn.disabled = false;
      } 
    }
  }

  async updateLogbook() {
      const updateBtn = this.querySelector('#bt-update');
      if (updateBtn) {
        updateBtn.disabled = true;
        // Affiche un symbole d'attente
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' + this.gettext('Logbook update');
      }    
      let data = [];
      let nbToInsert = 0;
      this.dataTableInstance.rows().data().toArray().forEach(row => {
        if (row.toInsert === true) {
          data.push(row);
          nbToInsert++;
        }
      });
      let nbInserted = 0;
      // Boucle asynchrone séquentielle
      for (const element of data) {
        try {
            const params = {
                invoketype: 'add:usb',
                args: {
                    flightData : element,
                    strRename : this.gettext('To rename')
                }
            }            
            const result = await window.electronAPI.invoke(params);            
            if (result.success) {
              nbInserted++;            
            } 
        } catch (error) {
          // A archiver dans le journal de log
          console.log('Error adding flight: ' + error.message);
        }
      }
      // On fera un alert et un retour au carnet comme dans L6
      this.displayStatus(this.currentGpsLib+' : '+nbInserted+' / '+nbToInsert+' '+this.gettext('flights inserted'), 'success');
      const divTable = this.querySelector('#div_table');
      // Vider la table et masquer le div
      if (this.dataTableInstance) {
        this.dataTableInstance.clear().draw();
      }
      if (divTable) divTable.style.display = 'none';
    }

    displayStatus(message, typeMsg) {
        const statusElement = this.querySelector('#importmenu');
        let msg
        switch (typeMsg) {
          case 'error':
            msg = '<span class="badge bg-danger">' + message + '</span>';
            break;
          case 'success':
            msg = '<span class="badge bg-success">' + message + '</span>';
            break;
          default:
            break;
        }
        statusElement.innerHTML = msg;
        statusElement.classList.remove('d-none');
    }    

    gettext(key) {
      return this.i18n[key] || key;
     }
}

window.customElements.define('imp-table', ImpTable);