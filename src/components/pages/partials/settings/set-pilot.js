class SetPilot extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Active le Shadow DOM
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
              <label for="pilot-name">Pilot name</label>
              <input type="text" id="pilot-name" />
              <input type="checkbox" id="pilot-priority" class="checkbox-label" />
              <span style="margin-left:10px;" id="pilot-priority-label">Priority on IGC field</span>
          </div>
          <div class="settings-field">
              <label for="glider">Glider</label>
              <input type="text" id="glider" />
              <input type="checkbox" id="glider-priority" class="checkbox-label" />
              <span style="margin-left:10px;" id="glider-priority-label">Priority on IGC field</span>
          </div>
          <div class="settings-field">
              <label for="usual-gps">Usual GPS</label>
              <select id="usual-gps">
                  <option value="gps1">GPS 1</option>
                  <option value="gps2">GPS 2</option>
              </select>
              <input type="checkbox" id="only-new-flights" class="checkbox-label"/>
              <span style="margin-left:10px;" id="new-flights-label">Only display new flights</span>
              <label for="usb-limit" style="margin-left:3rem;text-align:right;">USB limit</label>
              <input type="text" id="usb-limit" maxlength="2" class="short-input" />
              <span style="margin-left:0.5rem;">Months</span>
          </div>
          <div class="settings-field">
              <label for="pilot-mail">Pilot mail</label>
              <input type="text" id="pilot-mail" />
          </div>
          <div class="settings-field">
              <label for="league">League</label>
              <select id="league">
                  <option value="league1">League 1</option>
                  <option value="league2">League 2</option>
              </select>
          </div>
          <div class="settings-field">
              <label for="login">Login</label>
              <input type="text" id="login" />
              <label for="pass" style="margin-left:1.5rem;text-align:right;">Pass</label>
              <input type="password" id="pass" />
          </div>
        </div>
        `;
        // Ajoute ici les listeners pour les boutons si besoin
    }

    setupEventListeners() { }

    async langRequest() {
        this.i18n = await window.electronAPI.langmsg();
        console.log('Settings -> '+this.i18n['Settings'])
    }  

    gettext(key) {
        return this.i18n[key] || key;
    }       
}

window.customElements.define('set-pilot', SetPilot);