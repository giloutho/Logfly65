export class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="app-footer">
        <small>© 2025 Logfly. Tous droits réservés.</small>
      </footer>
    `;
  }
}

customElements.define("app-footer", AppFooter);
