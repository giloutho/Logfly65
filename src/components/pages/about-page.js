export class AboutPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4">
        <h1>À propos</h1>
        <p>Cette app est construite avec Electron, Bootstrap et Web Components.</p>
        <p>Elle sert d'exemple pour démontrer l'utilisation de ces technologies.</p>
        <p>Pas mal Gil...</p>
      </div>
    `;
  }
}

customElements.define("about-page", AboutPage);
