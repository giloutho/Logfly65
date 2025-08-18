export class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4">
        <h1>Accueil</h1>
        <p>Bienvenue dans mon app Electron avec routing centralisé !</p>
      </div>
    `;
  }
}
customElements.define("home-page", HomePage);
