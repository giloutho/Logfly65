export class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="bg-light text-center py-2 mt-auto border-top">
        <small>&copy; 2025 - MonApp Electron</small>
      </footer>
    `;
  }
}

customElements.define("app-footer", AppFooter);
