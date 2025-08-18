import { getRouteConfig } from "./router.js";

export class AppBody extends HTMLElement {
  static get observedAttributes() {
    return ["route"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  async render() {
    const route = this.getAttribute("route") || "home";

    this.innerHTML = `<div class="p-3 text-muted">Chargement...</div>`;

    try {
      const config = getRouteConfig(route);
      await config.module(); // lazy load du module
      this.innerHTML = "";
      this.appendChild(document.createElement(config.tag));
    } catch (err) {
      console.error("Erreur route :", err);
      this.innerHTML = `<div class="p-3 text-danger">Erreur de chargement</div>`;
    }
  }
}

customElements.define("app-body", AppBody);
