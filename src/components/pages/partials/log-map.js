// Un squelette basique de Web Component
export class LogMap extends HTMLElement {
  constructor() {
    super();
    // Optionnel : création d'un shadow DOM
    // this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html */`        
        <div id="map-pm"><h2>Carte Logfly</h2></div>      
    `;
  }
}

customElements.define('log-map', LogMap);
