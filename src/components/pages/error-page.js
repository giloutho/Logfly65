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
                <input id="create-logbook-input" type="text" class="form-control d-inline-block" style="width:220px;margin-left:1rem;" placeholder="${this.gettext('Type the name without extension')}">
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
            selectBtn.addEventListener('click', () => this.selectLogbook());
        }

        const createBtn = this.querySelector('#create-logbook-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.newLogbook());
        }

        // Restriction de saisie alphanumérique sur l'input
        const input = this.querySelector('#create-logbook-input');
        if (input) {
            input.addEventListener('input', (e) => {
                // Remplace tout ce qui n'est pas lettre ou chiffre par rien
                e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
            });
        }        
    }    

    async selectLogbook() {
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
            alert(''+this.gettext('Logbook selection cancelled'));
            return;
        }
        console.log(this.gettext('Logbook selected')+': '+chooseLogbook.filePaths[0]);
        const fileParams = {
            invoketype: 'settings:choose',
            args : {
                filePath : chooseLogbook.filePaths[0]
            }
        }
        const result =  await window.electronAPI.invoke(fileParams);
        if (result.success) {
            console.log('Logbook selected successfully');
            window.location.hash = "#home";
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

    async newLogbook() {
        let newDbName = document.getElementById('create-logbook-input').value
        if (newDbName != undefined && newDbName != '') {
            // remove extension if needed
            newDbName.replace(/\.[^/.]+$/, "")
            // add db extension
            newDbName += '.db' 
            const createParams = {
                invoketype: 'settings:create',
                args : {
                    dbName : newDbName
                }
            }
            const result =  await window.electronAPI.invoke(createParams);
            if (result.success) {
                alert(this.gettext('Logbook created successfully'));
                window.location.hash = "#import";
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
        } else {
            alert(this.gettext('Logbook name is empty'))
        } 
    }

    async langRequest() {
        this.i18n = await window.electronAPI.langmsg();
    }  

    gettext(key) {
        return this.i18n[key] || key;
    }   

}

window.customElements.define('error-page', ErrorPage);