class SetPilot extends HTMLElement {
    constructor() {
        super();
        this.i18n = {} // Ecrasé par le parent
        this.attachShadow({ mode: 'open' }); // Active le Shadow DOM
    }

    async connectedCallback() {
      this.render();
      this.setupEventListeners();
    }

    render() {    
        this.shadowRoot.innerHTML = /*html */`
        <style>
            .settings-container {
              margin-left: 16px;
              margin-right: 16px;
              padding-top: 15px;
              padding-bottom: 15px;
            }               
            .settings-field {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
                gap: 0;
            }
            .settings-group {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .settings-field label:not(.checkbox-label) {
                min-width: 110px;
                margin-right: 0.5rem;
            }
            .checkbox-label {
                min-width: 20px !important;
            }    
            .settings-field input[type="text"],
            .settings-field input[type="password"],
            .settings-field select {
                min-width: 200px;
                margin-right: 0.5rem;
            }
            .settings-field input[type="checkbox"] {
              margin: 0 !important;
              padding: 0;
              vertical-align: middle;
            }
            /* Espace EXACT de 1px entre la checkbox et SON label */
            .settings-field input[type="checkbox"] + label.checkbox-label {
              margin-left: 1px !important;
              min-width: unset !important;
            }            
            .settings-field input.short-input[type="text"] {
                width: 1.5rem !important;
                min-width: unset !important;
            }
        </style>
        <div class="settings-container">        
          <div class="settings-field">
              <label id="label-pilot-name" for="pilot-name">Pilot name</label>
              <input type="text" id="pilot-name" />
              <input type="checkbox" id="pilot-priority" class="checkbox-label" />
              <span style="margin-left:10px;" id="pilot-priority-label">Priority on IGC field</span>
          </div>
          <div class="settings-field">
              <label id="label-glider" for="glider">Glider</label>
              <input type="text" id="glider" />
              <input type="checkbox" id="glider-priority" class="checkbox-label" />
              <span style="margin-left:10px;" id="glider-priority-label">Priority on IGC field</span>
          </div>
          <div class="settings-field">
              <label id="label-usual-gps" for="usual-gps">Usual GPS</label>
              <select id="sel-gps">
                  <option value="gps1">GPS 1</option>
                  <option value="gps2">GPS 2</option>
              </select>
              <input type="checkbox" id="only-new-flights" class="checkbox-label"/>
              <span style="margin-left:10px;" id="new-flights-label">Only display new flights</span>
              <label id="label-usb-limit" for="usb-limit" style="margin-left:3rem;text-align:right;">USB limit</label>
              <input type="text" id="usb-limit" maxlength="2" class="short-input" />
              <span style="margin-left:0.5rem;" id="usb-limit-label">Months</span>
          </div>
          <div class="settings-field">
              <label id="label-pilot-mail" for="pilot-mail">Pilot mail</label>
              <input type="text" id="pilot-mail" />
          </div>
          <div class="settings-field">
              <label id="label-league" for="league">League</label>
              <select id="sel-league">
              </select>
          </div>
          <div class="settings-field">
              <label id="label-login" for="login">Login</label>
              <input type="text" id="login" />
              <label id="label-pass" for="pass" style="margin-left:1.5rem;text-align:right;">Pass</label>
              <input type="password" id="pass" />
          </div>
        </div>
        `;
        // Ajoute ici les listeners pour les boutons si besoin
    }

    setupEventListeners() { }

    setI18n(i18n) {
        this.i18n = i18n;
        this.translation(); // Met à jour les labels traduits
        this.translateSelect(); 
    }  

    async translation() {
        this.shadowRoot.getElementById('label-pilot-name').textContent = this.gettext('Pilot name');
        this.shadowRoot.getElementById('label-glider').textContent = this.gettext('Glider');
        this.shadowRoot.getElementById('label-usual-gps').textContent = this.gettext('Usual GPS');
        this.shadowRoot.getElementById('label-usb-limit').textContent = this.gettext('USB limit');
        this.shadowRoot.getElementById('usb-limit-label').textContent = this.gettext('Months');
        this.shadowRoot.getElementById('label-pilot-mail').textContent = this.gettext('Pilot mail');
        this.shadowRoot.getElementById('label-league').textContent = this.gettext('League');
        this.shadowRoot.getElementById('label-login').textContent = this.gettext('Login');
        this.shadowRoot.getElementById('label-pass').textContent = this.gettext('Pass');
        // Pour les labels de priorité, utilise les bons id si tu veux les traduire
        this.shadowRoot.getElementById('pilot-priority-label').textContent = this.gettext('Priority on IGC field');
        this.shadowRoot.getElementById('glider-priority-label').textContent = this.gettext('Priority on IGC field');
        this.shadowRoot.getElementById('new-flights-label').textContent = this.gettext('Only display new flights');
    }

    translateSelect() {
        const selectGps = this.shadowRoot.getElementById('sel-gps');
        if (!selectGps) return;
        selectGps.innerHTML = ''; // Vide le select
        const gpsList = [
            { key: 'none', val: this.gettext(' No GPS selected') },
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
            selectGps.appendChild(option);
        });

        const selectLeague = this.shadowRoot.getElementById('sel-league');      
        if (!selectLeague) return;
        selectLeague.innerHTML = '';    // Vide le select       
        const leagues = [
            { key: 'FR', val: 'FFVL' },
            { key: 'XC', val: 'XContest' },
            { key: 'FAI', val: 'FAI' },
            { key: 'FAIC', val: 'FAI-Cylinders' },
            { key: 'FAIO', val: 'FAI-OAR' },
            { key: 'FAIOA', val: 'FAI-OAR2' },
            { key: 'XL', val: 'XCLeague' }
        ]
        leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league.key;
            option.textContent = league.val;
            selectLeague.appendChild(option);
        });        
    }

    gettext(key) {
        return this.i18n[key] || key;
    }       
}

window.customElements.define('set-pilot', SetPilot);