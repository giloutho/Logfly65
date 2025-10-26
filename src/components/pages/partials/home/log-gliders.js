class LogGliders extends HTMLElement {
    constructor() {
        super();
        this.i18n = {} // initialisé par le parent
        this.modal = null;
        this.rowData = null;
    }

    async connectedCallback() {
        this.render();
        this.modal = new bootstrap.Modal(this.querySelector('#flightModal'));
        // Force la saisie en majuscule dans le champ newglider
        const newGliderInput = this.querySelector('#newglider');
        newGliderInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
        this.querySelector('#validate-btn').onclick = () => this.updateGlider();                  
    }

    open(rowData) {
        this.rowData = rowData;
        this.fillGlidersList();
        this.querySelector('#winModalTitle').innerHTML = this.gettext('Change glider');
        this.querySelector('#choose-glider-title').innerHTML = this.gettext('Choose an existant glider');
        this.querySelector('#new-glider-title').innerHTML = this.gettext('Or new glider');  
        this.modal.show();
    }    

    render() {
        this.innerHTML = /*html */`  
            <div class="modal fade" id="flightModal" tabindex="-1" aria-labelledby="flightModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                        <h5 class="modal-title" id="winModalTitle">Détail du vol</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="display: flex; flex-direction: column; gap: 1.2rem;">
                            <div class="alert alert-info">
                                <h5 id="choose-glider-title">${this.gettext('Choose an existant glider')}</h5>
                                <select id="flight-glider" class="form-select"></select>
                            </div>
                            <div class="alert alert-info">
                                <h5 id="new-glider-title">${this.gettext('Or new glider')}</h5>
                                <input type="text" id="newglider" class="form-control" placeholder="${this.gettext('Enter new glider name')}">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.gettext('Cancel')}</button>                        
                            <button type="button" class="btn btn-primary" id="validate-btn">${this.gettext('OK')}</button>
                        </div>
                    </div>
                </div>
            </div>       
        `;
    }    

    updateGlider() {
        const newGlider = this.querySelector('#newglider').value.trim();
        let selectedGlider = '';
        if (newGlider !== '') {
            selectedGlider = newGlider;
        } else {
            selectedGlider = this.querySelector('#flight-glider').value;
        }
        this.validate(selectedGlider);
    }    

    validate(selectedGlider) {
        this.dispatchEvent(new CustomEvent('glider-updated', {
            detail: {
                V_Engin: selectedGlider
            },
            bubbles: true,
            composed: true
        }));
        this.modal.hide();
    }        

    async fillGlidersList() {
        const gliderSelect = this.querySelector('#flight-glider');
        gliderSelect.innerHTML = ''; // Clear existing options
        const reqSQL = "SELECT DISTINCT V_Engin FROM Vol WHERE V_Engin IS NOT NULL AND V_Engin != '' ORDER BY upper(V_Engin)";
        try {
            const params = {
                invoketype: 'db:query',
                args: { sqlquery: reqSQL }
            };
            const resDb = await window.electronAPI.invoke(params);
            if (resDb.success) {
                resDb.result.forEach(row => {
                    const option = document.createElement('option');
                    option.value = row.V_Engin;
                    option.textContent = row.V_Engin;
                    gliderSelect.appendChild(option);
                });
                // Pré-sélectionne la valeur actuelle si présente
                if (this.rowData && this.rowData.V_Engin) {
                    gliderSelect.value = this.rowData.V_Engin;
                }
            } else {
                console.error(`\n-> Erreur requête : ${resDb.message}`);
            }
        } catch (err) {
            console.error('Erreur lors de l\'exécution de la requête:', err);
        }        
    }

    setI18n(i18n) {
        this.i18n = i18n;
    }  

    gettext(key) {
        return this.i18n[key] || key;
    }        

}

window.customElements.define('log-gliders', LogGliders);