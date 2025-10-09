import "./partials/imp-table.js";

export class ImportPage extends HTMLElement {
//   static get disabledFeatures() { 
//     return ['shadow']; 
//   }

  constructor() {
      super();
      this.dataTableInstance = null; // Ajout pour stocker l'instance DataTable
      this.i18n = {} // Pour stocker les messages
      this.langLoaded = false;
  }

  async connectedCallback() {
    if (!this.langLoaded) {
      await this.langRequest();
      this.langLoaded = true;
    }  
    this.render();
    this.setupEventListeners();
    this.dbOpen(); // Ouverture de la base de données 
  }  
    
  render() {
    this.innerHTML = /*html */`
        <style>
          .import-page-content * {
            font-size: 0.95em;
          }
        </style>
        <div class="import-page-content">
          <ul class="nav nav-pills">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" id="imp-gps" aria-expanded="false">${this.gettext('GPS import')}</a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" id="imp-gps-flysd" href="#">Flymaster SD</a></li>
                    <li><a class="dropdown-item" id="imp-gps-flyold" href="#">Flymaster Old</a></li>
                    <li><a class="dropdown-item" id= "imp-gps-fly20" href="#">Flytec 6020/30</a></li>
                    <li><a class="dropdown-item" id= "imp-gps-fly15" href="#">Flytec 6015</a></li>
                    <li><a class="dropdown-item" id="imp-gps-syr" href="#">Syride PC Tools</a></li>
                    <li><a class="dropdown-item" id="imp-gps-syrusb" href="#">Syride Usb</a></li>
                    <li><a class="dropdown-item" id="imp-gps-xct" href="#">XCTracer</a></li>
                    <li><a class="dropdown-item" id="imp-gps-rever" href="#">Reversale</a></li>
                    <li><a class="dropdown-item" id="imp-gps-sky2" href="#">Skytraax 2</a></li>
                    <li><a class="dropdown-item" id="imp-gps-sky3" href="#">Skytraax 3/4/5</a></li>
                    <li><a class="dropdown-item" id="imp-gps-oud" href="#">Oudie</a></li>
                    <li><a class="dropdown-item" id="imp-gps-cpil" href="#">CPilot</a></li>
                    <li><a class="dropdown-item" id="imp-gps-elem" href="#">Element</a></li>
                    <li><a class="dropdown-item" id="imp-gps-conn" href="#">Connect</a></li>  
                    <li><a class="dropdown-item" id="imp-gps-skydrop" href="#">Skydrop</a></li>            
                    <li><a class="dropdown-item" id="imp-gps-vardui" href="#">Varduino</a></li>  
                    <li><a class="dropdown-item" id="imp-gps-flynet" href="#">Flynet</a></li>
                    <li><a class="dropdown-item" id="imp-gps-sens" href="#">Sensbox</a></li>
                    <li><hr class="dropdown-divider"></li>     
                    <li><a class="dropdown-item" id="list-usb" href="#">${this.gettext('Usb list')}</a></li>    
                    <li><a class="dropdown-item" id="list-serial" href="#">${this.gettext('Serial ports')}</a></li>  
                </ul>
            </li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button" id="imp-disk" aria-expanded="false">${this.gettext('Disk import')}</a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" id="imp-dsk-folder" href="#">${this.gettext('Folder')}</a></li>
                    <li><a class="dropdown-item" id="imp-dsk-track" href="#">${this.gettext('Track')}</a></li>                            
                </ul>
            </li>                    
            <li class="nav-item">
                <a class="nav-link" id="imp-disk" aria-current="page" href="#">${this.gettext('Flight without GPS track')}</a>
            </li>                
          </ul> 
          <div class="alert alert-info d-none" id='status' role="alert" style="margin-top: 10px">
              Display info about import status
          </div>  
          <imp-table></imp-table>                   
        </div>`;
    }

  setupEventListeners() {  

    const gpsUsbOptions = [
        { id: 'imp-gps-syrusb', type: 'syrusb', lib : 'Syride USB' },
        { id: 'imp-gps-xct', type: 'xct', lib : 'XCTracer' },
        { id: 'imp-gps-rever', type: 'rever', lib : 'Reversale' },
        { id: 'imp-gps-sky2', type: 'sky2', lib : 'Skytraxx 2' },
        { id: 'imp-gps-sky3', type: 'sky3', lib : 'Skytraxx 3' },
        { id: 'imp-gps-oud', type: 'oud', lib : 'Oudie' },
        { id: 'imp-gps-cpil', type: 'cpil', lib : 'CPilot' },
        { id: 'imp-gps-elem', type: 'elem', lib : 'Element' },
        { id: 'imp-gps-conn', type: 'connect', lib : 'Connect' },
        { id: 'imp-gps-skydrop', type: 'skydrop', lib : 'SkyDrop' },
        { id: 'imp-gps-vardui', type: 'vardui', lib : 'Varduino' },
        { id: 'imp-gps-flynet', type: 'flynet', lib : 'Flynet' },
        { id: 'imp-gps-sens', type: 'sens', lib : 'Sensbox' }
    ];
    gpsUsbOptions.forEach(opt => {
        const el = this.querySelector(`#${opt.id}`);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.callUsbGps(opt.type, opt.lib);
            });
        }
    });        

    const gpsSerialOptions = [
        { id: 'imp-gps-flysd', type: 'flysd', lib: 'Flymaster SD' },
        { id: 'imp-gps-flyold', type: 'flyold', lib: 'Flymaster Old' },
        { id: 'imp-gps-fly20', type: 'fly20', lib: 'Flytec 6020/30' },
        { id: 'imp-gps-fly15', type: 'fly15', lib: 'Flytec 6015' },
    ];      
    gpsSerialOptions.forEach(opt => {
        const el = this.querySelector(`#${opt.id}`);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.callSerialGps(opt.type, opt.lib);

            });
        }
    });              
    // syride
    const impSyride = this.querySelector('#imp-gps-syr');
    if (impSyride) {
        impSyride.addEventListener('click', (e) => {
            e.preventDefault(); // si c'est un lien <a>
            alert('call Syride PC Tools');
        });
    }
    const impDiskFolder = this.querySelector('#imp-dsk-folder');
    if (impDiskFolder) {
        impDiskFolder.addEventListener('click', (e) => {
            e.preventDefault();
            this.testStore()

        });
    }
    const impDiskTrack = this.querySelector('#imp-dsk-track');
    if (impDiskTrack) {
        impDiskTrack.addEventListener('click', (e) => {
            alert('Import track')
        });
    }
    const mnuListUsb = this.querySelector('#list-usb');
    if (mnuListUsb) {
        mnuListUsb.addEventListener('click', (e) => {
            e.preventDefault();
            this.ListUsb()
        });
    }                  

    this.querySelector("#list-serial").addEventListener("click", async () => {
      await this.showSerialPorts();
    });
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
                } else {
                    console.error(`\n-> ${result.message}`);
                }
            } catch (err) {
                console.error('Erreur lors de l\'ouverture de la base de données:', err);
            }        
    }

    async callSerialGps(typeGps, libGps) {     
        let specOs = await window.electronAPI.storeGet('specOS');  
         console.log('Serial call : '+libGps+' '+specOs);   
        this.displayStatus(`${this.gettext('Search')} ${libGps}`, true);   
        try {
            const result = await window.electronAPI.invoke({ invoketype: 'gps:serial' });
            if (result.success && Array.isArray(result.portsarray)) {
                if (result.portsarray.length === 0) {
                    this.displayStatus(this.gettext('No usable serial port detected'), false);
                } else {
                    const ports = result.portsarray.slice().reverse();
                    for (let i = 0; i < ports.length; i++) {
                        const port = ports[i];
                        const gpsReq =  {
                            'chip': port.manufacturer,
                            'model': typeGps,
                            'port': port.path
                        }
                        const msg = `${libGps} ...    ${this.gettext('attempt to read on ' + port.path)}&nbsp; &nbsp; &nbsp;<span class="spinner-border spinner-border-sm text-danger" role="status" aria-hidden="true"></span>`;
                        this.displayStatus(msg, true);
                        //await new Promise(resolve => setTimeout(resolve, 3000)); // Attente de 3 secondes
                        const params = {
                            invoketype: 'gpsdump:list',
                            args: {
                                gpsModel : gpsReq
                            }
                        }    
                        const resultSerial = await window.electronAPI.invoke(params);
                        console.log('resultSerial.flights.length: ' + resultSerial.flights.length);
                        console.log('Flight 0 : ' + resultSerial.flights[0].date + ' ' + resultSerial.flights[0].duration);
                        break; // on arrête après le premier port testé

                    }
                    this.displayStatus('Terminé...', true);
                    // const params = {
                    //     invoketype: 'gpsdump:list',
                    //     args: {
                    //         portsarray : result.portsarray
                    //     }
                    // }            
                    // const resultSerial = await window.electronAPI.invoke(params);
                    // if (resultSerial.success && Array.isArray(resultSerial.flights)) {
                    //       console.log(`[ImpPage] Serial GPS detection successful`);
                    //     //console.log(`[ImpPage] Serial GPS detection successful: ${resultSerial.flights.length} flights found.`);
                    // } else {
                    //     const errMsg = resultSerial.message || this.gettext('Error during serial GPS detection');
                    //     this.displayStatus(errMsg, false);
                    // }
                }
            } else {
                const errMsg = result.message || this.gettext('Unable to retrieve serial ports');
                this.displayStatus(errMsg, false);
            }
        } catch (error) {
            this.displayStatus(error.message, false);
        }
    }

    async callUsbGps(typeGps, libGps) {
        this.displayStatus(`${this.gettext('Search')} ${libGps}`, true);
        try {
            const params = {
                invoketype: 'gps:usb',
                args: {
                    typeGps: typeGps
            }
        }            
        const resultUsb = await window.electronAPI.invoke(params);
        if (resultUsb.success) {
            const msg = ` : ${this.gettext('found')} ...    ${this.gettext('Reading flights in progress')}&nbsp; &nbsp; &nbsp;<span class="spinner-border spinner-border-sm text-danger" role="status" aria-hidden="true"></span>`;
            this.displayStatus(msg, false);
            const params = {    
                invoketype: 'gps:impdisk',  
                args : {   
                        importPath : resultUsb.pathFlights
                    }
            }               
            const resImport = await window.electronAPI.invoke(params);
        //   if (resImport.success) {
        //       this.displayStatus(`&nbsp; &nbsp; &nbsp; ${this.gettext('Import completed')}`, false);                
        //   } else {
        //       this.displayStatus(`&nbsp; &nbsp; &nbsp; ${this.gettext('Import error')} : ${resImport.message}`, false);                    
        //   }           
            if (resImport.success) {
                // Calcule le nom de vol à importer  toInsert = true
                let totInsert = 0;
                for (const flight of resImport.result) {
                    if (flight.toInsert == true) totInsert++;
                }
                console.log(`[ImpPage] Import successful: ${resImport.result.length} flights imported.`);
                // Envoi des données à ImpTable
                const importData = {
                    typeGps: typeGps,
                    libGps: libGps,
                    flights: resImport.result
                }
                this.querySelector('#status').classList.add('d-none');
                const impTable = this.querySelector('imp-table');
                if (impTable) {
                    impTable.classList.remove('d-none');
                }
                this.dispatchEvent(new CustomEvent('flights-import', {
                    detail: { importData: importData },
                    bubbles: true, // pour permettre la remontée dans le DOM
                    composed: true // pour traverser le shadow DOM si besoin
                }));


            } else {
                const msgError = this.gettext('Import failed') + ' : ' + resImport.message;
                console.error(msgError);
                this.displayStatus(msgError, true);
            }        
        } else {
            this.displayStatus(resultUsb.message, false);
        }    
    } catch (error) {
        this.displayStatus(this.gettext('Error during USB GPS detection') + ' : ' + error.message, false);            
    } 
  }

  async showSerialPorts() {
    let htmlMsg = '';
    try {
      const result = await window.electronAPI.invoke({ invoketype: 'gps:serial' });
      if (result.success && Array.isArray(result.portsarray)) {
        if (result.portsarray.length === 0) {
          htmlMsg = this.gettext('No usable serial port detected');
        } else {
          htmlMsg = `<table class="table table-sm table-bordered"><thead><tr><th>${this.gettext('Name')}</th><th>${this.gettext('Manufacturer')}</th></tr></thead><tbody>`;                
          htmlMsg += result.portsarray.map(port => `<tr><td>${port.path}</td><td>${port.manufacturer || this.gettext('Unknown')}</td></tr>`).join('');
          htmlMsg += '</tbody></table>';
        }
      } else {
        htmlMsg = result.message || this.gettext('Unable to retrieve serial ports');
      }
    } catch (error) {
      htmlMsg = error.message;
    }
    this.displayStatus(htmlMsg, true);
  }

  async ListUsb() {
      try {
          // Masquer les éléments du webcomponent imp-table
          const impTable = this.querySelector('imp-table');
          if (impTable) {
              impTable.classList.add('d-none');
          }
          const params = {
              invoketype: 'gps:usb',
              args: {
                  typeGps: 'listUsb'
              }
          }            
          const resultUsb = await window.electronAPI.invoke(params);
          if (resultUsb.success && Array.isArray(resultUsb.usbDrivesInfo)) {
              let html = '<table class="table table-sm table-bordered"><thead><tr><th>Description</th><th>Size</th><th>Mountpoints</th></tr></thead><tbody>';                
              resultUsb.usbDrivesInfo.forEach(usb => {
                  html += `<tr>
                      <td>${usb.description || ''}</td>
                      <td>${usb.size ? Math.floor(usb.size / 100000) + ' Mo' : ''}</td>
                      <td>${Array.isArray(usb.mountpoints) ? usb.mountpoints.map(mp => mp.path).join(', ') : ''}</td>
                  </tr>`;
              });
              html += '</tbody></table>';
              this.displayStatus(html, true);
          } else {
              this.displayStatus(resultUsb.message, true);
          }    
      } catch (error) {
          this.displayStatus('Erreur lors de la détection des périphériques USB : ' + error.message, true);            
      }
  }  

  displayStatus(message, updateDisplay) {
      const statusElement = this.querySelector('#status');
      const textElement = statusElement.textContent;
      if (updateDisplay) {
          statusElement.innerHTML = message;
      } else {
          statusElement.innerHTML = textElement + '&nbsp;&nbsp;&nbsp;&nbsp;' + message;
      }
      statusElement.classList.remove('d-none');        
  }  

  async langRequest() {
    this.i18n = await window.electronAPI.langmsg();
    console.log('Import from a GPS -> '+this.i18n['Import from a GPS'])
  }  

  gettext(key) {
    return this.i18n[key] || key;
  }   

}

customElements.define("import-page", ImportPage);
