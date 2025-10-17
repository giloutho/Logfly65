class SetWeb extends HTMLElement {
    constructor() {
        super();
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
                <label for="logfly-url">Logfly site url</label>
                <input type="text" id="logfly-url" />
            </div>
            <div class="settings-field">
                <label for="download-url">Download url</label>
                <input type="text" id="download-url" />
            </div>
            <div class="settings-field">
                <label for="flyxc-url">FlyXC url</label>
                <input type="text" id="flyxc-url" />
            </div>
            <div class="settings-field">
                <label for="airspace-url">Airspace download url</label>
                <input type="text" id="airspace-url" />
            </div>
            <div class="settings-field">
                <label for="claim-url">Claim url</label>
                <input type="text" id="claim-url" />
            </div>
        </div>
        `;
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

window.customElements.define('set-web', SetWeb);