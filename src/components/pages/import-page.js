import "./app-table.js";

export class ImportPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4">
        <h1>Import</h1>
        <button id="list-ports-btn" class="btn btn-secondary">Afficher les ports séries</button>
        <ul id="ports-list" class="mt-3"></ul>
      </div>
    `;

    this.querySelector("#list-ports-btn").addEventListener("click", async () => {
      await this.showSerialPorts();
    });
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

customElements.define("import-page", ImportPage);
