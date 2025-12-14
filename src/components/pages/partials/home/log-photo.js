class LogPhoto extends HTMLElement {
    constructor() {
        super();
        this.i18n = {}; // initialisé par le parent
        this.flightId = null;
        this.rowIndex = null;
        this.resizedBase64 = null; // <-- Réinitialise ici
    }

    connectedCallback() {
        //implementation
    }

    open(flightId, rowIndex) {
        this.flightId = flightId;
        this.rowIndex = rowIndex;
        this.resizedBase64 = null; // <-- Réinitialise ici

        // Crée la modale si elle n'existe pas déjà
        let modal = this.querySelector('#photoModal');
        if (!modal) {
            this.innerHTML += /*html */`
            <div class="modal fade" id="photoModal" tabindex="-1">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Choisir une photo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body">
                    <input type="file" id="photoInput" accept="image/jpeg" style="display:none;">
                    <button id="choosePhotoBtn" class="btn btn-primary mb-2">Choisir une photo JPG</button>
                    <div id="photoFileName" style="margin-top:10px;"></div>
                    <div id="photoPreview" style="margin-top:10px; text-align:center;"></div>
                  </div>
                  <div class="modal-footer">
                    <button id="validatePhotoBtn" class="btn btn-success" disabled>Valider</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                  </div>
                </div>
              </div>
            </div>
            `;
        }

        // Sélection des éléments
        modal = this.querySelector('#photoModal');
        const photoInput = modal.querySelector('#photoInput');
        const choosePhotoBtn = modal.querySelector('#choosePhotoBtn');
        const validatePhotoBtn = modal.querySelector('#validatePhotoBtn');
        const photoFileName = modal.querySelector('#photoFileName');
        const photoPreview = modal.querySelector('#photoPreview');

        // Réinitialise l'état
        photoInput.value = '';
        photoFileName.textContent = '';
        photoPreview.innerHTML = '';
        validatePhotoBtn.disabled = true;
        this.resizedBase64 = null;

        // Ouvre le sélecteur de fichier au clic sur le bouton
        choosePhotoBtn.onclick = () => photoInput.click();

        // Affiche le nom du fichier, active le bouton valider et montre la vignette
        photoInput.onchange = () => {
            if (photoInput.files.length > 0) {
                const file = photoInput.files[0];
                photoFileName.textContent = file.name;

                // Affiche la vignette et redimensionne l'image
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        // Détermine les dimensions finales
                        let maxWidth, maxHeight;
                        const isHorizontal = img.width >= img.height;
                        
                        if (isHorizontal) {
                            maxWidth = 960;
                            maxHeight = 600;
                        } else {
                            maxWidth = 500;
                            maxHeight = 720;
                        }

                        // Calcule les dimensions redimensionnées en conservant le ratio
                        let newWidth = img.width;
                        let newHeight = img.height;

                        if (newWidth > maxWidth) {
                            newHeight = (maxWidth / newWidth) * newHeight;
                            newWidth = maxWidth;
                        }

                        if (newHeight > maxHeight) {
                            newWidth = (maxHeight / newHeight) * newWidth;
                            newHeight = maxHeight;
                        }

                        // Crée un canvas pour redimensionner
                        const canvas = document.createElement('canvas');
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);

                        // Convertit en Base64 (qualité JPEG 0.85)
                        this.resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);

                        // Affiche la vignette (300x300 max pour l'aperçu)
                        const previewWidth = Math.min(newWidth, 300);
                        const previewHeight = Math.min(newHeight, 300);
                        photoPreview.innerHTML = `<img src="${this.resizedBase64}" style="max-width:${previewWidth}px;max-height:${previewHeight}px;border-radius:8px;box-shadow:0 2px 8px #0002;">`;

                        // Active le bouton valider
                        validatePhotoBtn.disabled = false;
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                photoFileName.textContent = '';
                validatePhotoBtn.disabled = true;
                photoPreview.innerHTML = '';
                this.resizedBase64 = null;
            }
        };

        // Validation : remonte le buffer Base64 au parent
        validatePhotoBtn.onclick = () => {
            if (this.resizedBase64) {
                console.log('Photo redimensionnée et encodée en Base64');
                // Utilise this.flightId et this.rowIndex ici
                this.dispatchEvent(new CustomEvent('photo-selected', {
                    detail: { 
                        base64: this.resizedBase64,
                        flightId: this.flightId,
                        rowIndex: this.rowIndex
                    },
                    bubbles: true,
                    composed: true
                }));
                // Ferme la modale
                const bsModal = window.bootstrap.Modal.getOrCreateInstance(modal);
                bsModal.hide();
            }
        };

        // Affiche la modale
        const bsModal = window.bootstrap.Modal.getOrCreateInstance(modal);
        bsModal.show();
    }
}

window.customElements.define('log-photo', LogPhoto);