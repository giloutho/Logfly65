import "./partials/home/log-table.js";
import "./partials//home/log-map.js";
import "./partials//home/log-details.js";

export class HomePage extends HTMLElement {
  connectedCallback() {
        this.innerHTML = /*html */`
                <div class="row">
                    <div class="col-lg-7 h-100">
                         <log-map class="h-100" id="logMap"></log-map>
                    </div>
                    <div class="col-lg-5 h-100" id="right-panel">
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

}
customElements.define("home-page", HomePage);
