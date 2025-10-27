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
                  .settings-highlight {
                    background: linear-gradient(135deg, #e0f0ff 0%, #b3d8ff 100%);
                    border-radius: 0.7rem;
                    box-shadow: 0 2px 8px #2196f344;
                    padding: 1.2rem 1rem 0.7rem 1rem;
                    margin-bottom: 2rem;
                  }
                  .settings-body {
                    margin: 10px;
                    padding-bottom: 10px !important;
                  }
                  .credit-label {
                    color: #0a2540;
                  }
                  .credit-name {
                    font-weight: 600;
                    color: #1a6dcc;
                    margin-right: 2.5rem;
                  }                      
                  #bt-new-logbook {
                    margin-left: 20px;
                  }
                </style>
                <div class="container-fluid px-2">
                  <div class="settings-highlight mb-4">
                    <div class="row align-items-center mb-2">
                      <div class="col-12 col-md-3 mb-2 mb-md-0 d-flex align-items-center">
                        <label id="label-language" for="select-language" class="form-label mb-0">${this.gettext('Language')}</label>
                        <select id="select-language" class="form-select ms-2"></select>
                      </div>
                      <div class="col-12 col-md-8 d-flex align-items-center h-100 py-0">
                        <span class="info" id="info-translate">${this.gettext('If you want to translate Logfly contact support')}</span>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-3 col-md-2 credit-label" id="credit-german">${this.gettext('German translation')}</div>
                      <div class="col-3 col-md-2 credit-name">Daniel Messelken</div>
                      <div class="col-3 col-md-2 credit-label" id="credit-italian">${this.gettext('Italian translation')}</div>
                      <div class="col-3 col-md-2 credit-name">Walter Segnana</div>
                    </div>
                  </div>
                  <div class="settings-body">
                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-current-logbook" for="current-logbook" class="form-label">${this.gettext('Current logbook')}</label>
                        <select id="current-logbook" class="form-select">
                          <option value="logbook1">Logbook 1</option>
                          <option value="logbook2">Logbook 2</option>
                        </select>
                      </div>
                      <div class="col-6 col-md-3">
                        <label id="label-create-logbook" for="create-logbook" class="form-label">${this.gettext('Create a new logbook')}</label>
                        <div class="input-group">
                          <input type="text" id="create-logbook" class="form-control" placeholder="${this.gettext('New logbook name')}">
                          <button type="button" class="btn btn-outline-info rounded-start" id="bt-new-logbook">${this.gettext('Create')}</button>
                        </div>
                      </div>
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-12 col-md-8 d-flex align-items-center">
                        <label id="label-repatriate-copy" for="repatriate-copy" class="form-label mb-0 me-2">${this.gettext('Repatriate a copy')}</label>
                        <button id="select-copy" class="btn btn-secondary btn-sm me-4">${this.gettext('Select')}</button>
                        <label id="label-auto-photo" for="auto-photo" class="form-label mb-0 me-2">${this.gettext('Automatic display of photos')}</label>
                        <select id="sel-photos" class="form-select form-select-sm" style="width: 80px; min-width: 60px; display: inline-block;"></select>
                      </div>
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-start-window" for="start-window" class="form-label">${this.gettext('Start window')}</label>
                        <select id="sel-start-window" class="form-select"></select>
                      </div>
                      <div class="col-6 col-md-3">
                        <label id="label-overview-mode" for="overview-mode" class="form-label">${this.gettext('Overview')}</label>
                        <select id="sel-overview-mode" class="form-select"></select>
                      </div>
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-default-map" for="default-map" class="form-label">${this.gettext('Default map')}</label>
                        <select id="default-map" class="form-select">
                          <option value="osm">OpenStreetMap</option>
                          <option value="ign">IGN</option>
                        </select>
                      </div>
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-default-map-latitude" for="latitude" class="form-label">${this.gettext('Default map latitude')}</label>
                        <input type="text" id="latitude" class="form-control" placeholder="e.g. 45.1234">
                      </div>
                      <div class="col-6 col-md-3">
                        <label id="label-default-map-longitude" for="longitude" class="form-label">${this.gettext('Default map longitude')}</label>
                        <input type="text" id="longitude" class="form-control" placeholder="e.g. 6.1234">
                      </div>
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