class UtilsPage extends HTMLElement {
    constructor() {
        super();
        //implementation
    }

  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4">
        <!-- Bouton qui ouvre le modal -->
        <button class="btn btn-primary" id="open-modal-btn" data-bs-toggle="modal" data-bs-target="#myModal">
          Ouvrir Modal
        </button>

        <!-- Modal -->
        <div class="modal fade" id="myModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Exemple de Modal</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" id="modal-body">
                <p>Contenu du modal...</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
              </div>
            </div>
          </div>
        </div>      
        <h1>Paramètres</h1>
        <form class="mt-3">
          <div class="mb-3">
            <label for="dbname" class="form-label">Nom de la base de données</label>
            <input type="text" class="form-control" id="dbname" placeholder="Votre base de données">
          </div>
          <div class="mb-3">
            <label for="theme" class="form-label">Thème</label>
            <select class="form-select" id="theme">
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>
          <button type="button" id="save-btn" class="btn btn-primary">Enregistrer</button>
        </form>
      </div>
    `;

    this.querySelector("#save-btn").addEventListener("click", async () => {
      const dbname = this.querySelector("#dbname").value;
      const theme = this.querySelector("#theme").value;
      await window.electronAPI.storeSet('dbname', dbname);
      alert("Paramètres enregistrés !");
    });

    this.querySelector("#open-modal-btn").addEventListener("click", async () => {
      const dbname = await window.electronAPI.storeGet('dbname');
      const modalBody = this.querySelector("#modal-body");
      modalBody.innerHTML = `<p>Nom de la base de données : ${dbname || 'Non défini'}</p>`;
    });
  }

}

window.customElements.define('utils-page', UtilsPage);