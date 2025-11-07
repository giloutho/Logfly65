import "./partials/home/log-table.js";
import "./partials//home/log-map.js";
import "./partials//home/log-details.js";

export class HomePage extends HTMLElement {

  constructor() {
      super();
      this.i18n = {}
  }  

  connectedCallback() {
        this.innerHTML = /*html */`
                <div class="row">
                    <div class="col-lg-6 h-100">
                         <log-map class="h-100" id="logMap"></log-map>
                    </div>
                    <div class="col-lg-6 h-100" id="right-panel">
                        <log-table class="h-100" style="font-size: 12px;font-weight: 400; line-height: 1;"></log-table>
                        <log-details></log-details>
                    </div>
                </div>

        `;
        this.querySelector('log-table').addEventListener('no-flights', (event) => {
          const rightPanel = this.querySelector('#right-panel');
          if (rightPanel) {
            rightPanel.innerHTML = `<div id="no-flights-msg" class="alert alert-info" style="margin-top:2rem;">${event.detail.panelMsg}</div>`;
          }
        });        
  }

  setI18n(i18n) {
    this.i18n = i18n;
    // Diffuse i18n aux sous-composants déjà présents
    this.querySelectorAll('log-details, log-gliders, log-map, log-sites, log-table').forEach(el => {
      if (typeof el.setI18n === 'function') {
        el.setI18n(this.i18n);
      } else {
        el.i18n = this.i18n;
      }    
    });
  }  

}
customElements.define("home-page", HomePage);
