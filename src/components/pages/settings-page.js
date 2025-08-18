export class SettingsPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4">
        <!-- Bouton qui ouvre le modal -->
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#myModal">
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
              <div class="modal-body">
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
            <label for="username" class="form-label">Nom d'utilisateur</label>
            <input type="text" class="form-control" id="username" placeholder="Votre pseudo">
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

    this.querySelector("#save-btn").addEventListener("click", () => {
      const username = this.querySelector("#username").value;
      const theme = this.querySelector("#theme").value;

      // Ici, tu pourrais utiliser IPC pour sauvegarder dans un fichier JSON ou en base locale
      console.log("Settings sauvegardés :", { username, theme });
      alert("Paramètres enregistrés !");
    });
  }
}

customElements.define("settings-page", SettingsPage);
