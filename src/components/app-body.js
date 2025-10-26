import { getRouteConfig } from "./router.js";

export class AppBody extends HTMLElement {
  static get observedAttributes() {
    return ["route"];
  }

  constructor() {
    super();
    this.i18n = null;
  }

  connectedCallback() {
    // Ne rien faire ici, le rendu sera déclenché par attributeChangedCallback
  }

  async attributeChangedCallback(name, oldValue, newValue) {
      if (typeof oldValue === 'undefined' || oldValue === newValue) {
        console.log('AppBody attributeChangedCallback ignoré (valeur identique ou oldValue non défini)');
        return;
      }
      console.log('AppBody attributeChangedCallback appelé');
      this.i18n = await window.electronAPI.langmsg();
      this.render();
      this.diffuseI18n();
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

  diffuseI18n() {
      // Diffuse i18n à tous les enfants directs qui l’acceptent
      this.querySelectorAll('*').forEach(child => {
          if (typeof child.setI18n === 'function') {
              child.setI18n(this.i18n);
          } else if ('i18n' in child) {
              child.i18n = this.i18n;
          }
      });
  }  
}

customElements.define("app-body", AppBody);
