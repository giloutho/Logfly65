class SetWeb extends HTMLElement {
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
            .settings-body {
                margin: 10px;
                padding-bottom: 10px;
            }
            .form-label-large {
                min-width: 300px;
                font-weight: 500;
            }
            .form-control {
                min-width: 120px;
            }
        </style>
        <div class="container-fluid px-2">
            <div class="settings-body">
                <div class="row g-3 mb-3">
                    <div class="col-12 col-md-8 d-flex align-items-center mb-2">
                        <label id="label-logfly-url" for="logfly-url" class="form-label-large me-2">${this.gettext('Logfly site url')}</label>
                        <input type="text" id="logfly-url" class="form-control" />
                    </div>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-12 col-md-8 d-flex align-items-center mb-2">
                        <label id="label-download-url" for="download-url" class="form-label-large me-2">${this.gettext('Download url')}</label>
                        <input type="text" id="download-url" class="form-control" />
                    </div>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-12 col-md-8 d-flex align-items-center mb-2">
                        <label id="label-flyxc-url" for="flyxc-url" class="form-label-large me-2">${this.gettext('FlyXC url')}</label>
                        <input type="text" id="flyxc-url" class="form-control" />
                    </div>
                </div>
                <div class="row g-3 mb-3">                    
                    <div class="col-12 col-md-8 d-flex align-items-center mb-2">
                        <label id="label-airspace-url" for="airspace-url" class="form-label-large me-2">${this.gettext('Airspace download url')}</label>
                        <input type="text" id="airspace-url" class="form-control" />
                    </div>
                </div>
                <div class="row g-3 mb-3">
                    <div class="col-12 col-md-8 d-flex align-items-center mb-2">
                        <label id="label-claim-url" for="claim-url" class="form-label-large me-2">${this.gettext('Claim url')}</label>
                        <input type="text" id="claim-url" class="form-control" />
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
        this.querySelector('#label-logfly-url').textContent = this.gettext('Logfly site url');
        this.querySelector('#label-download-url').textContent = this.gettext('Download url');
        this.querySelector('#label-flyxc-url').textContent = this.gettext('FlyXC url');
        this.querySelector('#label-airspace-url').textContent = this.gettext('Airspace download url');
        this.querySelector('#label-claim-url').textContent = this.gettext('Claim url');
        this.querySelector('#save-btn').textContent = this.gettext('Save');
    }


    async getStoredSettings() {
        const params = {
            invoketype: 'store-get-web',
            args: {}
        };
        const webSettings = await window.electronAPI.invoke(params);
        //console.log('SetWeb -> getStoredSettings : ', generalSettings)
        if (webSettings) {
            this.querySelector('#logfly-url').value = webSettings.urllogfly || '';
            this.querySelector('#download-url').value = webSettings.urligc|| '';
            this.querySelector('#flyxc-url').value = webSettings.urlflyxc || '';
            this.querySelector('#airspace-url').value = webSettings.urlairspace || '';
            this.querySelector('#claim-url').value = webSettings.urlcontest || '';
        }
    }

    getValues() {       
        return {        
            urllogfly: this.querySelector('#logfly-url').value,
            urligc: this.querySelector('#download-url').value,
            urlvisu: this.querySelector('#flyxc-url').value,
            urlairspace: this.querySelector('#airspace-url').value,
            urlcontest: this.querySelector('#claim-url').value
        };
    }

    gettext(key) {
        return this.i18n[key] || key;
    }       
}

window.customElements.define('set-web', SetWeb);