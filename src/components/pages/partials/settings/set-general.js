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
                        <label id="label-language" for="select-language" class="form-label mb-0">Language</label>
                        <select id="select-language" class="form-select ms-2"></select>
                      </div>
                      <div class="col-12 col-md-8 d-flex align-items-center h-100 py-0">
                        <span class="info" id="info-translate">If you want to translate Logfly contact support</span>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-3 col-md-2 credit-label" id="credit-german">German translation</div>
                      <div class="col-3 col-md-2 credit-name">Daniel Messelken</div>
                      <div class="col-3 col-md-2 credit-label" id="credit-italian">Italian translation</div>
                      <div class="col-3 col-md-2 credit-name">Walter Segnana</div>
                    </div>
                  </div>
                  <div class="settings-body">
                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-current-logbook" for="current-logbook" class="form-label">Current logbook</label>
                        <select id="current-logbook" class="form-select"></select>
                      </div>
                      <div class="col-6 col-md-4">
                        <label id="label-create-logbook" for="create-logbook" class="form-label">Create a new logbook</label>
                        <div class="input-group">
                          <input type="text" id="create-logbook" class="form-control">
                          <button type="button" class="btn btn-outline-info rounded-start" id="bt-new-logbook">Create</button>
                        </div>
                      </div>
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-repatriate-copy" for="repatriate-copy" class="form-label mb-0 me-2">Repatriate a copy</label>
                        <button id="select-copy" class="btn btn-secondary btn-sm me-4">Select</button>
                      </div>
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-3">
                        <label id="label-auto-screen" for="auto-screen" class="form-label mb-0 me-2">Full screen start</label>
                        <select id="sel-screen" class="form-select form-select-sm" style="width: 80px; min-width: 60px; display: inline-block;"></select>
                      </div>                      
                      <div class="col-6 col-md-4">
                        <label id="label-auto-photo" for="auto-photo" class="form-label mb-0 me-2">Automatic display of photos</label>
                        <select id="sel-photos" class="form-select form-select-sm" style="width: 80px; min-width: 60px; display: inline-block;"></select>
                      </div>                      
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-6 col-md-2">
                        <label id="label-start-window" for="start-window" class="form-label">Start window</label>
                        <select id="sel-start-window" class="form-select"></select>
                      </div>
                      <div class="col-6 col-md-2">
                        <label id="label-overview-mode" for="overview-mode" class="form-label">Overview</label>
                        <select id="sel-overview-mode" class="form-select"></select>
                      </div>                      
                    </div>

                    <div class="row g-3 mb-3">
                      <div class="col-4 col-md-2">
                        <label id="label-default-map" for="default-map" class="form-label">Default map</label>
                        <select id="default-map" class="form-select"></select>
                      </div>
                      <div class="col-4 col-md-2">
                        <label id="label-default-map-latitude" for="latitude" class="form-label">Default map latitude</label>
                        <input type="text" id="latitude" class="form-control" placeholder="e.g. 45.1234">
                      </div>
                      <div class="col-4 col-md-2">
                        <label id="label-default-map-longitude" for="longitude" class="form-label">Default map longitude</label>
                        <input type="text" id="longitude" class="form-control" placeholder="e.g. 6.1234">
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
    }

  setupEventListeners() { 
    this.querySelector('#bt-new-logbook').addEventListener('click', async () => {
      this.createLogbook();
    });

    this.querySelector('#select-copy').addEventListener('click', async () => {
      this.selectLogbookCopy();
    });
    this.querySelector('#save-btn').addEventListener('click', async () => {
      this.dispatchEvent(new CustomEvent('save-request', { bubbles: true }));
    });
  }

  setI18n(i18n) {
    this.i18n = i18n;
    this.translation(); // Met à jour les labels traduits
    this.getStoredSettings();
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
    this.querySelector('#create-logbook').placeholder = this.gettext('Type the name without extension');
    this.querySelector('#bt-new-logbook').textContent = this.gettext('Create');
    this.querySelector('#label-repatriate-copy').textContent = this.gettext('Repatriate a copy');
    this.querySelector('#select-copy').textContent = this.gettext('Select');
    this.querySelector('#label-auto-photo').textContent = this.gettext('Automatic display of photos');
    this.querySelector('#label-start-window').textContent = this.gettext('Start window');
    this.querySelector('#label-overview-mode').textContent = this.gettext('Overview');
    this.querySelector('#label-default-map').textContent = this.gettext('Default map');
    this.querySelector('#label-default-map-latitude').textContent = this.gettext('Default map latitude');
    this.querySelector('#label-default-map-longitude').textContent = this.gettext('Default map longitude');
    this.querySelector('#save-btn').textContent = this.gettext('Save');
  }

  async getStoredSettings() {
      const params = {
            invoketype: 'store-get-general',
            args: {}
      };
      const generalSettings = await window.electronAPI.invoke(params);
      console.log('General settings retrieved:', generalSettings);
      this.fillSelectLanguage(generalSettings.lang);
      this.fillSelectLogbook(generalSettings.dbFiles, generalSettings.dbName);
      this.fillSelectPhotos(generalSettings.photo);
      this.fillStartWindow(generalSettings.start);
      this.fillOverviewMode(generalSettings.over);
      this.fillSelectScreen(generalSettings.fullscreen);
      this.fillSelectMap(generalSettings.map);
      this.querySelector('#latitude').value = generalSettings.finderlat;
      this.querySelector('#longitude').value = generalSettings.finderlong;
  }
  
  fillSelectLanguage(currentLang) {
    const select = this.querySelector('#select-language');
    if (!select) return;
    select.innerHTML = ''; // Vide le select
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
        select.appendChild(option);
    });

    if (currentLang && langList.some(lang => lang.key === currentLang)) {
        select.value = currentLang;
    }
  }

  fillSelectLogbook(dbFiles, currentFile) {
    const select = this.querySelector('#current-logbook');
    if (!select) return;
    select.innerHTML = ''; // Vide le select

    dbFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        select.appendChild(option);
    });

    if (currentFile && dbFiles.includes(currentFile)) {
        select.value = currentFile;
    }
  }  

  fillSelectPhotos(currentPhotoSetting) {
    const select = this.querySelector('#sel-photos');
    if (!select) return;
    select.innerHTML = ''; // Vide le select
    const photoOptions = [
        { key: 'yes', val: this.gettext('Yes') },
        { key: 'no', val: this.gettext('No') }
    ]
    photoOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.key;
        opt.textContent = option.val;
        select.appendChild(opt);
    });
    if (currentPhotoSetting === 'yes' || currentPhotoSetting === 'no') {
        select.value = currentPhotoSetting;
    } else {
        select.value = 'yes';
    }
  }

  fillStartWindow(currentStart) {
    const select = this.querySelector('#sel-start-window');
    if (!select) return;
    select.innerHTML = '';
    const startWindowOptions = [
      { key: 'log', val: this.gettext('Logbook') },
      { key: 'ove', val: this.gettext('Overview') }
    ]
    startWindowOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.key;
        opt.textContent = option.val;
        select.appendChild(opt);
    });    
    if (currentStart && (currentStart === 'log' || currentStart === 'ove')) {
        select.value = currentStart;
    } else {
        select.value = 'log';
    }
  }  

  fillSelectScreen(currentScreenSetting) {
    const select = this.querySelector('#sel-screen');
    if (!select) return;
    select.innerHTML = ''; // Vide le select
    const screenOptions = [
        { key: 'yes', val: this.gettext('Yes') },
        { key: 'no', val: this.gettext('No') }
    ]
    screenOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.key;
        opt.textContent = option.val;
        select.appendChild(opt);
    });
    if (currentScreenSetting === 'yes' || currentScreenSetting === 'no') {
        select.value = currentScreenSetting;
    } else {
        select.value = 'no';
    }
  }  

  fillOverviewMode(currentOver) {
    const select = this.querySelector('#sel-overview-mode');
    if (!select) return;
    select.innerHTML = '';
    const overviewModeOptions = [
      { key: 'cal', val: this.gettext('Calendar year') },
      { key: 'last', val: this.gettext('Last twelve months') }
    ]
    overviewModeOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.key;
        opt.textContent = option.val;
        select.appendChild(opt);
    }); 
    if (currentOver && (currentOver === 'cal' || currentOver === 'last')) {
        select.value = currentOver;
    } else {
        select.value = 'cal';
    }
  }

  fillSelectMap(currentMap) { 
    const select = this.querySelector('#default-map');
    if (!select) return;
    select.innerHTML = '';
    const mapOptions = [
        { key: 'open', val: 'OpenTopo' },
        { key: 'ign', val: 'IGN' },
        { key: 'sat', val: 'Satellite' },
        { key: 'osm', val: 'OpenStreetMap' },
        { key: 'mtk', val: 'MTK' },
        { key: 'esri', val: 'EsriTopo' },
        { key: 'out', val: 'Outdoor' },        
    ]
    mapOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.key;
        opt.textContent = option.val;
        select.appendChild(opt);
    });
    if (currentMap && mapOptions.some(map => map.key === currentMap)) {
        select.value = currentMap;
    } else {
        select.value = 'osm';
    }
  } 

  getValues() {
    return {
      lang: this.querySelector('#select-language').value,
      dbName: this.querySelector('#current-logbook').value,
      photo: this.querySelector('#sel-photos').value,
      fullscreen: this.querySelector('#sel-screen').value,
      start: this.querySelector('#sel-start-window').value,
      over: this.querySelector('#sel-overview-mode').value,
      map: this.querySelector('#default-map').value,
      finderlat: this.querySelector('#latitude').value,
      finderlong: this.querySelector('#longitude').value
    };
  }

  async createLogbook() {
      let logbookName = this.querySelector('#create-logbook').value.trim().replace(/\.[^/.]+$/, '').replace(/\s+/g, '');
      if (logbookName === '') {
          alert(this.gettext('Logbook name is empty'));
          return;
      }
      // add db extension
      logbookName += '.db' 
      const createParams = {
          invoketype: 'settings:create',
          args : {
              dbName : logbookName
          }
      }
      const result =  await window.electronAPI.invoke(createParams);
      if (result.success) {
          // Ajoute le nouveau logbook à la liste des db
          const select = this.querySelector('#current-logbook');
          if (select) {
              const option = document.createElement('option');
              option.value = result.dbname;
              option.textContent = result.dbname;
              select.appendChild(option);
              select.value = result.dbname;
          }
          this.querySelector('#create-logbook').value = ''; // Vide le champ
      } else {
          let errMsg = 'Logbook creation error'+'\n';
          if (result.globalError && result.globalError !== '') {
              errMsg += result.globalError + '\n';
          }
          if (result.msgTag && result.msgTag !== '') {
              errMsg += result.msgTag + '\n';
          }
          if (result.msgTables && result.msgTables !== '') {
              errMsg += result.msgTables+' Tables : '+ result.tableCount;
          }
          alert(errMsg);
      }
  }

  async selectLogbookCopy() {
      const chooseMsg = this.gettext('Choose an existing logbook');
      const params = {
          invoketype: 'dialog:openfile',
          args: {
              title: chooseMsg,
              message : chooseMsg,
              defaultFolder: 'Logfly',
              buttonLabel: this.gettext('OK'),
              properties: ['openFile'],
              filters: [{ name: 'logbook', extensions: ['db'] }]
          }
      };
      const chooseLogbook = await window.electronAPI.invoke(params);
      if (chooseLogbook.canceled || chooseLogbook.filePaths.length === 0) {
          alert(''+this.gettext('The operation is canceled'));
          return;
      }
      console.log('Selected logbook file: ', chooseLogbook);
      const fileParams = {
          invoketype: 'settings:choose',
          args : {
              filePath : chooseLogbook.filePaths[0]
          }
      }
      const result =  await window.electronAPI.invoke(fileParams);
      if (result.success) {
          const newdbName = result.dbname;
          // Ajoute newdbName à la liste des db si absent
          const select = this.querySelector('#current-logbook');
          if (select) {
              let exists = false;
              for (let i = 0; i < select.options.length; i++) {
                  if (select.options[i].value === newdbName) {
                      exists = true;
                      break;
                  }
              }
              if (!exists) {
                  const option = document.createElement('option');
                  option.value = newdbName;
                  option.textContent = newdbName;
                  select.appendChild(option);
              }
              select.value = newdbName;
          }
      } else {
          // il peut y avoir trois messages possibles :
          // Nombre de tables msgTables != '' envoyer msgTables et tableCount
          // Impossible d'ajouter V_Tag V_Tag_Exists == false envoyer msgTag
          // globalError != '' envoyer globalError
          if (result.msgTables && result.msgTables !== '') {
              alert(this.gettext('Database issue: ') + result.msgTables + ' (' + this.gettext('Table count: ') + result.tableCount + ')');
          } else if (result.V_Tag_Exists === false) {
              alert(this.gettext('Database issue: ') + result.msgTag);
          } else if (result.globalError && result.globalError !== '') {
              alert(this.gettext('Database issue: ') + result.globalError);
          }
      }
  }      

  gettext(key) {
    return this.i18n[key] || key;
  }       
}

window.customElements.define('set-general', SetGeneral);