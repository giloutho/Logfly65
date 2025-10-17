class SetGeneral extends HTMLElement {
    constructor() {
        super();
        this.i18n = {} // Ecrasé par le parent
    }

    async connectedCallback() {
      this.render();
      this.setupEventListeners();
    }

    render() {
            this.innerHTML = /*html */`
                <style>
                  .settings-container {
                    margin-left: 16px;
                    margin-right: 16px;
                    padding-bottom: 15px;
                  }                  
                  .settings-highlight {
                    background: linear-gradient(135deg, #e0f0ff 0%, #b3d8ff 100%);
                    border-radius: 0.7rem;
                    box-shadow: 0 2px 8px #2196f344;
                    padding: 1.2rem 1rem 0.7rem 1rem;
                    margin-bottom: 2rem;
                  }
                  .settings-highlight-row {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-bottom: 0.5rem;
                  }
                  .settings-highlight label {
                    min-width: 120px;
                    margin-right: 0.5rem;
                    font-weight: 500;
                  }
                  .settings-highlight select {
                    min-width: 120px;
                    margin-right: 1.5rem;
                  }
                  .settings-highlight .info {
                    color: #0a2540;
                    font-size: 0.98em;
                    font-style: italic;
                  }
                  .settings-highlight .credit-label {
                    min-width: 140px;
                    color: #0a2540;
                  }
                  .settings-highlight .credit-name {
                    font-weight: 600;
                    color: #1a6dcc;
                    margin-right: 2.5rem;
                  }
                  /* Styles existants pour la suite */
                  .settings-field {
                    display: flex;
                    align-items: center;
                    margin-left: 20px;
                    margin-right: 20px;
                    margin-bottom: 1rem;
                  }
                  .settings-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                  }
                  .settings-field label {
                    width: 200px; 
                  }
                  .settings-field select,
                  .settings-field input {
                    min-width: 200px;
                    margin-right: 0.5rem;
                  }
                  .settings-field button {
                    min-width: 80px;
                  }
                  .ml-16 {
                    margin-left: 16px;
                  }    
                  .settings-group .ml-16 {
                    margin-left: 16px;
                    min-width: unset;
                  }                                
                </style>
                <div class="settings-container">
                  <div class="settings-highlight">
                    <div class="settings-highlight-row">
                      <label id="label-language" for="select-language">Language</label>
                      <select id="select-language">
                      </select>
                      <span class="info" id="info-translate">If you want to translate Logfly contact support</span>
                    </div>
                    <div class="settings-highlight-row">
                      <span class="credit-label" id="credit-german">German translation</span>
                      <span class="credit-name">Daniel Messelken</span>
                      <span class="credit-label" id="credit-italian">Italian translation</span>
                      <span class="credit-name">Walter Segnana</span>
                    </div>
                  </div>
                  <div class="settings-field">
                    <div class="settings-group">
                      <label id="label-current-logbook" for="current-logbook">Current logbook</label>
                      <select id="current-logbook">
                        <option value="logbook1">Logbook 1</option>
                        <option value="logbook2">Logbook 2</option>
                      </select>
                    </div>
                    <div class="settings-group">
                      <label id="label-create-logbook" for="create-logbook" style="margin-left:3rem;text-align:right;">Create logbook</label>
                      <input type="text" id="create-logbook" placeholder="New logbook name">
                      <button type="button" class="btn btn-outline-info" id="bt-new-logbook">Create</button>
                    </div>
                  </div>
                  <div class="settings-field">
                    <div class="settings-group">
                      <label id="label-repatriate-copy" for="repatriate-copy">Repatriate a copy</label>
                      <button id="select-copy" class="btn btn-secondary btn-sm">Select</button>
                    </div>             
                  </div>
                  <div class="settings-field">
                    <div class="settings-group">
                      <label id="label-auto-photo" for="auto-photo">Automatic display of photos</label>
                      <select id="sel-photos">
                      </select>
                    </div>                
                  </div>                  
                  <div class="settings-field">
                    <div class="settings-group">
                      <label id="label-start-window" for="start-window">Start window</label>
                      <select id="sel-start-window">
                      </select>
                    </div>
                    <div class="settings-group">
                      <label id="label-overview-mode" for="overview-mode" style="margin-left:3rem;text-align:right;">Overview</label>
                      <select id="sel-overview-mode">
                      </select>
                    </div>
                  </div>            
                  <div class="settings-field">
                    <div class="settings-group">
                      <label id="label-default-map" for="default-map">Default map</label>
                      <select id="default-map">
                        <option value="osm">OpenStreetMap</option>
                        <option value="ign">IGN</option>
                      </select>
                    </div>
                  </div>
                  <div class="settings-field">
                    <div class="settings-group">
                      <label id="label-default-map-latitude" for="latitude">Default map latitude</label>
                      <input type="text" id="latitude" placeholder="e.g. 45.1234">
                    </div>
                    <div class="settings-group">
                      <label id="label-default-map-longitude" for="longitude" style="text-align:right;">Default map longitude</label>
                      <input type="text" id="longitude" placeholder="e.g. 6.1234">
                    </div>
                  </div>
                </div>
        `;
    }

  setupEventListeners() { }

  setI18n(i18n) {
    this.i18n = i18n;
    this.translation(); // Met à jour les labels traduits
    this.translateSelect();
  }  

  async translation() {
    // Met à jour les labels toutes les traductions
    console.log('Language -> '+this.i18n['Language'])
    this.querySelector('#label-language').textContent = this.gettext('Language');
    this.querySelector('#info-translate').textContent = this.gettext('If you want to translate Logfly contact support');
    this.querySelector('#credit-german').textContent = this.gettext('German translation');
    this.querySelector('#credit-italian').textContent = this.gettext('Italian translation');      
    this.querySelector('#label-current-logbook').textContent = this.gettext('Current logbook');
    this.querySelector('#label-create-logbook').textContent = this.gettext('Create a new logbook');
    this.querySelector('#bt-new-logbook').textContent = this.gettext('Create');
    this.querySelector('#label-repatriate-copy').textContent = this.gettext('Repatriate a copy');
    this.querySelector('#select-copy').textContent = this.gettext('Select');
    this.querySelector('#label-auto-photo').textContent = this.gettext('Automatic display of photos');
    this.querySelector('#label-start-window').textContent = this.gettext('Start window');
    this.querySelector('#label-overview-mode').textContent = this.gettext('Overview');
    this.querySelector('#label-default-map').textContent = this.gettext('Default map');
    this.querySelector('#label-default-map-latitude').textContent = this.gettext('Default map latitude');
    this.querySelector('#label-default-map-longitude').textContent = this.gettext('Default map longitude');
  }

  translateSelect() {
      const selectLang = this.querySelector('#select-language');
      if (!selectLang) return;
      selectLang.innerHTML = ''; // Vide le select
      const langList = [
          { key: 'de', val: this.gettext('German') },
          { key: 'en', val: this.gettext('English') },
          { key: 'fr', val: this.gettext('French') },
          { key: 'it', val: this.gettext('Italian') }
      ]      
      langList.forEach(lang => {
          const option = document.createElement('option');
          option.value = lang.key;
          option.textContent = lang.val;
          selectLang.appendChild(option);
      });
      const selectPhotos = this.querySelector('#sel-photos');
      if (!selectPhotos) return;

      selectPhotos.innerHTML = '';
      const photoOptions = [
          { key: 'yes', val: this.gettext('Yes') },
          { key: 'no', val: this.gettext('No') }
      ]
      photoOptions.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option.key;
          opt.textContent = option.val;
          selectPhotos.appendChild(opt);
      });

      const selectStartWindow = this.querySelector('#sel-start-window');
      if (!selectStartWindow) return;
      selectStartWindow.innerHTML = '';
      const startWindowOptions = [
        { key: 'log', val: this.gettext('Logbook') },
        { key: 'ove', val: this.gettext('Overview') }
      ]
      startWindowOptions.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option.key;
          opt.textContent = option.val;
          selectStartWindow.appendChild(opt);
      });

      const selectOverviewMode = this.querySelector('#sel-overview-mode');;
      if (!selectOverviewMode) return;
      selectOverviewMode.innerHTML = '';
      const overviewModeOptions = [
        { key: 'cal', val: this.gettext('Calendar year') },
        { key: 'last', val: this.gettext('Last twelve months') }
      ]
      overviewModeOptions.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option.key;
          opt.textContent = option.val;
          selectOverviewMode.appendChild(opt);
      }); 

  }  

  gettext(key) {
    return this.i18n[key] || key;
  }       
}

window.customElements.define('set-general', SetGeneral);