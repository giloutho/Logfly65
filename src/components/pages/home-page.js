import "./partials/log-table.js";
import "./partials/log-map.js";
import "./partials/log-details.js";

export class HomePage extends HTMLElement {
  connectedCallback() {
        this.innerHTML = /*html */`
                <div class="row">
                    <div class="col-lg-7 h-100">
                         <log-map class="h-100" id="logMap"></log-map>
                    </div>
                    <div class="col-lg-5 h-100">
                        <log-table class="h-100" style="font-size: 12px;font-weight: 400; line-height: 1;"></log-table>
                        <log-details></log-details>
                    </div>
                    </div>

                </div>

        `;
  }


  async openDb() {

  }

}
customElements.define("home-page", HomePage);
