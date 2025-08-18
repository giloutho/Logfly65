export class NotFoundPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container py-4 text-center">
        <h1>404</h1>
        <p>Page non trouvée.</p>
      </div>
    `;
  }
}

customElements.define("notfound-page", NotFoundPage);