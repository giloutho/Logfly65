import { getRouteConfig } from "./router.js";

export class AppBody extends HTMLElement {
  static get observedAttributes() {
    return ["route"];
  }

  constructor() {
    super();
    console.log('AppBody instancié');
  }

  connectedCallback() {
    // Ne rien faire ici, le rendu sera déclenché par attributeChangedCallback
  }

    attributeChangedCallback(name, oldValue, newValue) {
      if (typeof oldValue === 'undefined' || oldValue === newValue) {
        console.log('AppBody attributeChangedCallback ignoré (valeur identique ou oldValue non défini)');
        return;
      }
      console.log('AppBody attributeChangedCallback appelé');
      this.render();
  }

  async render() {
    const route = this.getAttribute("route") || "home";
    console.log('AppBody render appelé pour la route :', route);

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
