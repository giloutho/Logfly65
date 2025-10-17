import "./partials/settings/set-pilot.js";
import "./partials/settings/set-general.js";
import "./partials/settings/set-web.js";

export class SettingsPage extends HTMLElement {

  constructor() {
      super();
      this.dataTableInstance = null; // Ajout pour stocker l'instance DataTable
      this.i18n = {} // Pour stocker les messages
      this.langLoaded = false;
  }

  async connectedCallback() {
    if (!this.langLoaded) {
      await this.langRequest();
      this.langLoaded = true;
    }  
    this.render();
    this.setupEventListeners();
  }  

  render() {
    this.innerHTML = /*html */`
    <style>
        .nav-tabs {
          border-bottom: none;
          background: linear-gradient(135deg, #1a6dcc 0%, #0a2540 100%);
          padding: 0.2rem 0.5rem;
          box-shadow: 0 2px 8px #0a254033;
          margin-top: 0.1rem;
          margin-bottom: 1rem;
        }
        .nav-tabs .nav-link {
          color: #e0f0ff;
          border: none;
          background: transparent;
          margin: 0 0.2rem;
          border-radius: 0.5rem 0.5rem 0 0;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          font-weight: 500;
          font-size: 1.08rem;
          padding: 0.7rem 1.5rem;
        }
        .nav-tabs .nav-link.active, .nav-tabs .nav-link:focus, .nav-tabs .nav-link:hover {
          background: linear-gradient(135deg, #e0f0ff 0%, #b3d8ff 100%);
          color: #0a2540;
          box-shadow: 0 2px 8px #2196f355;
        }
        .tab-pane {
          background: #f8fbff;
          border-radius: 0 0 0.7rem 0.7rem;
          box-shadow: 0 2px 8px #0a254022;
          margin-bottom: 2rem;
        }
      </style>
      <ul class="nav nav-tabs" id="settingsTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab">${this.gettext('General')}</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="pilot-tab" data-bs-toggle="tab" data-bs-target="#pilot" type="button" role="tab">${this.gettext('Pilot')}</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="web-tab" data-bs-toggle="tab" data-bs-target="#web" type="button" role="tab">${this.gettext('Web')}</button>
        </li>
      </ul>
      <div class="tab-content" id="settingsTabsContent">
        <div class="tab-pane fade show active" id="general" role="tabpanel">
            <set-general></set-general>
        </div>
        <div class="tab-pane fade" id="pilot" role="tabpanel">
            <set-pilot></set-pilot>
        </div>
        <div class="tab-pane fade" id="web" role="tabpanel">
            <set-web></set-web>
        </div>
        <div style="margin-top: 1.5rem; text-align: center;">
          <button class="btn btn-danger" id="save-btn">${this.gettext('Save Settings')}</button>
          <div class="modal fade" id="infoModal" tabindex="-1" aria-labelledby="infoModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="infoModalLabel">${this.gettext('Current Settings')}</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="modal-body">
                  <!-- Le contenu sera rempli dynamiquement -->
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${this.gettext('Close')}</button>
                </div>
              </div>
            </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() { }

  async langRequest() {
    this.i18n = await window.electronAPI.langmsg();
    console.log('Settings -> '+this.i18n['Settings'])
  }  

  gettext(key) {
    return this.i18n[key] || key;
  }   

}


customElements.define("settings-page", SettingsPage);
