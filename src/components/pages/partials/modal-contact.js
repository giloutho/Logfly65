class ModalContact extends HTMLElement {
   constructor() {
        super();
        this.i18n = {} // initialisé par le parent
        this.errorMsg = "";
        this.modal = null;
    }

    connectedCallback() {
        // Ce dispatchEvent informe le parent que la modale est prête
        // Contrrement à d'autres modales, seti18n ne pouvait pas être appelé avant
        // comme dans log-sites par exemple
        this.dispatchEvent(new CustomEvent('modal-contact-ready', { bubbles: true, composed: true }));
        this.render();
        this.modal = new bootstrap.Modal(this.querySelector('#contactModal'));
        this.setMessage();

        // Ajoute l'écouteur de soumission du formulaire
        this.querySelector('#contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    render() {
        this.innerHTML = /*html */`
        <style>
            .modal-content {
                background: linear-gradient(135deg, #1a6dcc 0%, #0a2540 100%);
                color: #fff;
                border-radius: 1rem;
                border: none;
            }
            .modal-header, .modal-footer {
                border: none;
                background: transparent;
            }
            .modal-title {
                color: #e0f0ff;
                font-weight: bold;
            }
            .form-label {
                color: #b3d8ff;
                text-align: left;      /* <-- Ajouté */
                display: block;        /* <-- Ajouté */
            }
            .form-control {
                background: #e0f0ff;
                color: #0a2540;
                border-radius: 0.5rem;
                border: 1px solid #b3d8ff;
            }
            .form-control:focus {
                border-color: #2196f3;
                box-shadow: 0 0 0 2px #2196f3aa;
            }
            .btn-primary {
                background: linear-gradient(135deg, #2196f3 0%, #1a6dcc 100%);
                border: none;
                color: #fff;
            }
            .btn-primary:hover {
                background: #1761b0;
            }
            .btn-secondary {
                background: #b3d8ff;
                color: #0a2540;
                border: none;
            }
            .btn-secondary:hover {
                background: #e0f0ff;
            }
            .contact-input-half {
                width: 50%;
                min-width: 200px;
                max-width: 100%;
                margin-left: 0;
                margin-right: auto;
                display: block;
            }
        </style>
        <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="contactModalLabel">${this.gettext('Send an e-mail')}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <form id="contact-form">
                            <div class="mb-3">
                                <label for="contact-name" class="form-label">${this.gettext('Name')}</label>
                                <input type="text" class="form-control contact-input-half" id="contact-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="contact-email" class="form-label">${this.gettext('Email')}</label>
                                <input type="email" class="form-control contact-input-half" id="contact-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="contact-message" class="form-label">${this.gettext('Message')}</label>
                                <textarea class="form-control" id="contact-message" rows="8" required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.gettext('Cancel')}</button>
                        <button type="submit" form="contact-form" class="btn btn-primary">${this.gettext('Send')}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    handleSubmit() {
        const name = this.querySelector('#contact-name').value.trim();
        const email = this.querySelector('#contact-email').value.trim();

        // Vérification du nom
        if (!name) {
            alert(this.gettext('Name is required'));
            this.querySelector('#contact-name').focus();
            return false;
        }

        // Vérification de l'email
        if (!email) {
            alert(this.gettext('E-mail is required'));
            this.querySelector('#contact-email').focus();
            return false;
        }
        // Regex simple pour valider l'adresse e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert(this.gettext('Invalid email address format'));
            this.querySelector('#contact-email').focus();
            return false;
        }
        this.sendMail(name, email, this.querySelector('#contact-message').value.trim());
        //return true;
    }    

    sendMail(name, email, message) {
        // Implémente la logique d'envoi d'e-mail ici
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('message', message);

        fetch('https://www.logfly.org/mail/support.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(this.gettext('Email sent successfully'));
                this.modal.hide();
            } else {
                alert(this.gettext('Error sending mail: ') + (data.error || ''));
            }
        })
        .catch(err => {
            alert(this.gettext('Error sending mail: ') + err.message);
            console.error(err);
        });       
        this.modal.hide();
    }

    open() {
        this.modal.show();
    }          
    
    setI18n(i18n, errorMsg) {
        this.i18n = i18n;
        this.errorMsg = errorMsg
        console.log('modal-contact setI18n called with errorMsg:', errorMsg);
    }      

    setMessage() {
        let msgArea = 'Error on first start of Logfly 7:\n';  
        msgArea += '   ->  '+this.errorMsg + '\n\n';
        msgArea += `--- ${this.gettext('Add your comment if you wish')} ---\n`;
        this.querySelector('#contact-message').value = msgArea
    }

    gettext(key) {
        return this.i18n[key] || key;
    }  
}

window.customElements.define('modal-contact', ModalContact);