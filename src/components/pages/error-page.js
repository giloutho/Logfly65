class ErrorPage extends HTMLElement {
    constructor() {
        super();
        this.i18n = {} // Pour stocker les messages
        this.langLoaded = false;
        this._startParam = null;
    }

    set startParam(obj) {
        this._startParam = obj;
        this.render();
    }

    get startParam() {
        return this._startParam;
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
        const errorMsg = this._startParam?.globalError || "Vous devez confirmer la copie du carnet de vol";
        this.innerHTML = /*html */`
            <div class="container py-4 text-center">
                <h1 id="error-title">${this.gettext('Logfly could not start')}</h1>
                
                <div id="error-report-section" style="margin-bottom:4rem;">
                    <span id="error-report-label" style="font-weight:bold;">${this.gettext('Migration')} Logfly 7 ${this.gettext('Error report')} : </span>
                    <div id="error-report" style="margin-top:0.5rem;">${errorMsg}</div>
                </div>
                
                <section id="select-logbook-section" style="margin-bottom:4rem;">
                    <span id="select-logbook-label" style="font-weight:bold;">${this.gettext('Choose an existing logbook')}</span>
                    <button id="select-logbook-btn" class="btn btn-success" style="margin-left:1rem;">${this.gettext('Select')}</button>
                </section>
                
                <section id="create-logbook-section" style="margin-bottom:4rem;">
                    <span id="create-logbook-label" style="font-weight:bold;">${this.gettext('Create a new logbook')}</span>
                    <button id="create-logbook-btn" class="btn btn-warning" style="margin-left:1rem;">${this.gettext('Create')}</button>
                </section>
                
                <section id="contact-support-section">
                    <span id="contact-support-label" style="font-weight:bold;">${this.gettext('Contact support')}</span>
                    <button id="contact-support-btn" class="btn btn-danger" style="margin-left:1rem;">${this.gettext('Send an e-mail')}</button>
                </section>
            </div>
        `;
    }    

    setupEventListeners() {  
        const selectBtn = this.querySelector('#select-logbook-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', async () => {
                const chooseMsg = this.gettext('Choose an existing logbook')
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
                    alert(''+this.gettext('Logbook selection cancelled'));
                    return;
                }
                alert(''+this.gettext('Logbook selected')+': '+chooseLogbook.filePaths[0]);
            });
        }        
    }    

    async langRequest() {
        this.i18n = await window.electronAPI.langmsg();
        console.log('Import from a GPS -> '+this.i18n['Import from a GPS'])
    }  

    gettext(key) {
        return this.i18n[key] || key;
    }   

}

window.customElements.define('error-page', ErrorPage);