import "./app-table.js";

export class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4">
        <h1>Accueil</h1>
        <p>Bienvenue dans mon app Electron avec routing centralisé !</p>
        <button id="test-db-btn" class="btn btn-primary">Tester l'ouverture de la base SQLite</button>
        <button id="list-ports-btn" class="btn btn-secondary">Afficher les ports séries</button>
        <ul id="ports-list" class="mt-3"></ul>
        <app-table></app-table>
      </div>
    `;

    this.querySelector("#test-db-btn").addEventListener("click", async () => {
      // this.openDb();
      this.openFile();
    });

    this.querySelector("#list-ports-btn").addEventListener("click", async () => {
      await this.showSerialPorts();
    });
  }

  async openFile() {
      try {
        const fileName ='testfile.txt';
        const params = {
            invoketype: 'file:read',
            args: { fileName }
        };
        const result = await window.electronAPI.invoke(params);
        if (result.success) {
          alert(`Fichier ouvert avec succès : ${result}`);
        } else {
          alert(result.message);
        }        
      } catch (error) {
        alert(`Erreur lors de l'ouverture du fichier : ${error.message}`);
      }
  }

  async openDb() {
      try {
        const filePath = '/Users/gil/Documents/Logfly/test.db'; // Remplacez par le chemin de votre base de données
        const params = {
            invoketype: 'db:open',
            args: { filePath }
        };
        const result = await window.electronAPI.invoke(params);
        if (result.success) {
          alert(`Base ouverte avec succès : ${result}`);
        } else {
          alert(result.message);
        }        
      } catch (error) {
        alert(`Erreur lors de l'ouverture de la base : ${error.message}`);
      }
  }

  async showSerialPorts() {
    try {
      const result = await window.electronAPI.invoke({ invoketype: 'gps:serial' });
      const listElem = this.querySelector('#ports-list');
      if (result.success && Array.isArray(result.portsarray)) {
        if (result.portsarray.length === 0) {
          listElem.innerHTML = '<li>Aucun port série détecté.</li>';
        } else {
          listElem.innerHTML = result.portsarray.map(port => `<li>${port.path} (${port.manufacturer || 'inconnu'})</li>`).join('');
        }
      } else {
        listElem.innerHTML = `<li>Erreur : ${result.message || 'Impossible de récupérer les ports.'}</li>`;
      }
    } catch (error) {
      this.querySelector('#ports-list').innerHTML = `<li>Erreur : ${error.message}</li>`;
    }
  }

}
customElements.define("home-page", HomePage);
