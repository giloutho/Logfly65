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
            .settings-container {
                margin-left: 16px;
                margin-right: 16px;
                padding-top: 15px;
                padding-bottom: 15px;
                border-radius: 16px;
                background: #f8fbff;
            }
            .settings-field {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
            }
            .settings-field label {                
                width: 250px; 
                margin-right: 0.5rem;
                font-weight: 500;
            }
            .settings-field input[type="text"] {
                min-width: 220px;
                flex: 1;
                padding: 0.2rem 0.5rem;
            }
        </style>
        <div class="settings-container">
            <div class="settings-field">
                <label id="label-logfly-url" for="logfly-url">Logfly site url</label>
                <input type="text" id="logfly-url" />
            </div>
            <div class="settings-field">
                <label id="label-download-url" for="download-url">Download url</label>
                <input type="text" id="download-url" />
            </div>
            <div class="settings-field">
                <label id="label-flyxc-url" for="flyxc-url">FlyXC url</label>
                <input type="text" id="flyxc-url" />
            </div>
            <div class="settings-field">
                <label id="label-airspace-url" for="airspace-url">Airspace download url</label>
                <input type="text" id="airspace-url" />
            </div>
            <div class="settings-field">
                <label id="label-claim-url" for="claim-url">Claim url</label>
                <input type="text" id="claim-url" />
            </div>
        </div>
        `;
    }

    setupEventListeners() { }

    setI18n(i18n) {
        this.i18n = i18n;
        this.translation(); // Met à jour les labels traduits
    }  

    async translation() {
        this.querySelector('#label-logfly-url').textContent = this.gettext('Logfly site url');
        this.querySelector('#label-download-url').textContent = this.gettext('Download url');
        this.querySelector('#label-flyxc-url').textContent = this.gettext('FlyXC url');
        this.querySelector('#label-airspace-url').textContent = this.gettext('Airspace download url');
        this.querySelector('#label-claim-url').textContent = this.gettext('Claim url');
    }

    gettext(key) {
        return this.i18n[key] || key;
    }       
}

window.customElements.define('set-web', SetWeb);