class SetPilot extends HTMLElement {
    constructor() {
        super();
        this.i18n = {}; // Ecrasé par le parent
    }

    async connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = /*html */`
            <style>
                .settings-body {
                    margin: 10px;
                    padding-top: 15px;
                    padding-bottom: 10px !important;
                }
                .form-label {
                    min-width: 110px;
                    margin-bottom: 0.3rem;
                }
                .short-input {
                    width: 3.5rem !important;
                    min-width: unset !important;
                    display: inline-block;
                }
                .checkbox-label {
                    min-width: 20px !important;
                    margin-left: 2px;
                }
                .priority-label {
                    margin-left: 10px;
                }
                #pilot-name,
                #glider {
                text-transform: uppercase;
                }                
                @media (max-width: 900px) {
                    .settings-container {
                        margin: 2px;
                        padding: 8px 2px;
                    }
                }
            </style>
            <div class="container-fluid px-2">
                <div class="settings-body">
                    <div class="row g-3 mb-3">
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">
                            <label id="label-pilot-name" for="pilot-name" class="form-label me-2">${this.gettext('Pilot name')}</label>
                            <input type="text" id="pilot-name" class="form-control me-2" />
                        </div>
                        <div class="col-12 col-md-6 d-flex align-items-center mb-2">
                            <input type="checkbox" id="pilot-priority" class="form-check-input" />
                            <span class="priority-label" id="pilot-priority-label">${this.gettext('Priority on IGC field')}</span>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">
                            <label id="label-glider" for="glider" class="form-label me-2">${this.gettext('Glider')}</label>
                            <input type="text" id="glider" class="form-control me-2" />
                        </div>
                        <div class="col-12 col-md-6 d-flex align-items-center mb-2">                            
                            <input type="checkbox" id="glider-priority" class="form-check-input" />
                            <span class="priority-label" id="glider-priority-label">${this.gettext('Priority on IGC field')}</span>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2 flex-wrap">
                            <label id="label-usual-gps" for="usual-gps" class="form-label me-2">${this.gettext('Usual GPS')}</label>
                            <select id="sel-gps" class="form-select me-3" style="max-width:180px;"></select>
                        </div>
                        <div class="col-12 col-md-3 d-flex align-items-center mb-2">    
                            <input type="checkbox" id="only-new-flights" class="form-check-input" />
                            <span class="priority-label" id="new-flights-label">${this.gettext('Only display new flights')}</span>
                        </div>
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">                                
                            <label id="label-usb-limit" for="usb-limit" class="form-label ms-4 me-2">${this.gettext('USB limit')}</label>
                            <input type="text" id="usb-limit" maxlength="2" class="form-control short-input me-2" />
                            <span id="usb-limit-label">${this.gettext('Months')}</span>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">
                            <label id="label-pilot-mail" for="pilot-mail" class="form-label me-2">${this.gettext('Pilot mail')}</label>
                            <input type="text" id="pilot-mail" class="form-control" />
                        </div>
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">
                            <label id="label-league" for="league" class="form-label me-2">${this.gettext('League')}</label>
                            <select id="sel-league" class="form-select"></select>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">
                            <label id="label-login" for="login" class="form-label me-2">${this.gettext('Login')}</label>
                            <input type="text" id="login" class="form-control me-3" />
                        </div>
                        <div class="col-12 col-md-4 d-flex align-items-center mb-2">                            
                            <label id="label-pass" for="pass" class="form-label me-2">${this.gettext('Pass')}</label>
                            <input type="password" id="pass" class="form-control" />
                        </div>
                    </div>

                    <div class="row mb-3">
                      <div class="col-12 d-flex justify-content-center">
                        <button type="button" class="btn btn-danger" id="save-btn">Save</button>
                      </div>
                    </div>   

                </div>
            </div>
        `;
        // Ajoute ici les listeners pour les boutons si besoin
    }

    setupEventListeners() { 
        this.querySelector('#save-btn').addEventListener('click', async () => {
        this.dispatchEvent(new CustomEvent('save-request', { bubbles: true }));
        });
    }

    setI18n(i18n) {
        this.i18n = i18n;
        this.translation();
        this.getStoredSettings();
    }

    async translation() {
        this.querySelector('#label-pilot-name').textContent = this.gettext('Pilot name');
        this.querySelector('#label-glider').textContent = this.gettext('Glider');
        this.querySelector('#label-usual-gps').textContent = this.gettext('Usual GPS');
        this.querySelector('#label-usb-limit').textContent = this.gettext('USB limit');
        this.querySelector('#usb-limit-label').textContent = this.gettext('Months');
        this.querySelector('#label-pilot-mail').textContent = this.gettext('Pilot mail');
        this.querySelector('#label-league').textContent = this.gettext('League');
        this.querySelector('#label-login').textContent = this.gettext('Login');
        this.querySelector('#label-pass').textContent = this.gettext('Pass');
        this.querySelector('#pilot-priority-label').textContent = this.gettext('Priority on IGC field');
        this.querySelector('#glider-priority-label').textContent = this.gettext('Priority on IGC field');
        this.querySelector('#new-flights-label').textContent = this.gettext('Only display new flights');
        this.querySelector('#save-btn').textContent = this.gettext('Save');
    }

    async getStoredSettings() {
        const params = {
            invoketype: 'store-get-pilot',
            args: {}
        };
        const pilotSettings = await window.electronAPI.invoke(params);

        console.log('Pilot settings retrieved:', pilotSettings);
        this.querySelector('#pilot-name').value = pilotSettings.name;
        this.querySelector('#pilot-priority').checked = pilotSettings.namepriority;
        this.querySelector('#glider').value = pilotSettings.glider;
        this.querySelector('#glider-priority').checked = pilotSettings.gliderpriority
        this.fillSelectGps(pilotSettings.gps);
        this.querySelector('#usb-limit').value = pilotSettings.gpsusb;
        this.querySelector('#only-new-flights').checked = pilotSettings.newflights;
        this.querySelector('#pilot-mail').value = pilotSettings.pilotid;
        this.fillSelectLeague(pilotSettings.league);
        this.querySelector('#login').value = pilotSettings.pilotid;
        this.querySelector('#pass').value = pilotSettings.pilotpass;
        
    }

    getValues() {
        return {
            name: this.querySelector('#pilot-name').value.toUpperCase(),
            namepriority: this.querySelector('#pilot-priority').checked ? 1 : 0,
            glider: this.querySelector('#glider').value.toUpperCase(),
            gliderpriority: this.querySelector('#glider-priority').checked ? 1 : 0,
            gps: this.querySelector('#sel-gps').value,
            gpsusb: this.querySelector('#usb-limit').value,
            newflights: this.querySelector('#only-new-flights').checked ? 1 : 0,
            mail: this.querySelector('#pilot-mail').value,
            league: this.querySelector('#sel-league').value,
            pilotid: this.querySelector('#login').value,
            pilotpass: this.querySelector('#pass').value
        };
    }

    fillSelectGps(currentGps) {
        const select = this.querySelector('#sel-gps');
        if (!select) return;
        select.innerHTML = ''; 
        const gpsList = [
            { key: 'none', val: this.gettext('Not selected') },
            { key: '6020', val: '6020/6030' },
            { key: '6015', val: '6015' },
            { key: 'flynet', val: 'Flynet' },
            { key: 'flymold', val: 'Flymaster (old)' },
            { key: 'rever', val: 'Reversale' },
            { key: 'sky2', val: 'Skytraax 2' },
            { key: 'oudi', val: 'Oudie' },
            { key: 'elem', val: 'Element' },
            { key: 'sens', val: 'Sensbox' },
            { key: 'syri', val: 'Syride' },
            { key: 'flyma', val: 'Flymaster' },
            { key: 'conn', val: 'Connect' },
            { key: 'sky3', val: 'Skytraxx 3/4' },
            { key: 'cpil', val: 'C-Pilot Evo' },
            { key: 'xctra', val: 'XC Tracer' },
            { key: 'digi', val: 'Digifly' },
            { key: 'vard', val: 'Varduino' }      
        ]
        gpsList.forEach(gps => {
            const option = document.createElement('option');
            option.value = gps.key;
            option.textContent = gps.val;
            select.appendChild(option);
        });

        if (currentGps && gpsList.some(gps => gps.key === currentGps)) {
            select.value = currentGps;
        } else {
            select.value = 'none';
        }
    }    

  fillSelectLeague(currentLeague) {         
    const select = this.querySelector('#sel-league');
    if (!select) return;
    select.innerHTML = '';          
    const leagues = [
        { key: 'FR', val: 'FFVL' },
        { key: 'XC', val: 'XContest' },
        { key: 'FAI', val: 'FAI' },
        { key: 'FAIC', val: 'FAI-Cylinders' },
        { key: 'FAIO', val: 'FAI-OAR' },
        { key: 'FAIOA', val: 'FAI-OAR2' },
        { key: 'XL', val: 'XCLeague' }
    ];
    leagues.forEach(league => {
        const option = document.createElement('option');
        option.value = league.key;
        option.textContent = league.val;
        select.appendChild(option);
    });
    if (currentLeague && leagues.some(league => league.key === currentLeague)) {
        select.value = currentLeague;
    } else {
        select.value = 'XC';
    }   
}

    gettext(key) {
        return this.i18n[key] || key;
    }
}

window.customElements.define('set-pilot', SetPilot);