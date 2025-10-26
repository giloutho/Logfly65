import "./log-gliders.js"
import "./log-sites.js"

class LogDetails extends HTMLElement {

  constructor() {
    super();
    this.i18n = {}; // initialisé par le parent
    this.dbId = null;
    this.rowData = null;
    this.rowIndex = null;
  }    

  async connectedCallback() {
    this.render();
    this.setupEventListeners();    
  }

  render() {
      this.innerHTML = /*html */`
      <style>
        :host {
          display: block;
          font-size: 0.85rem; /* taille réduite seulement ici */
        }
        .nav-link, .dropdown-toggle {
          font-size: 0.8rem;
        }
        .tab-content {
          font-size: 0.8rem;
        }
        button {
          font-size: 0.8rem;
        }
        .dropdown-item {
        font-size: 0.8rem;
        color: #0d6efd;
        }
        .dropdown-item:hover,
        .dropdown-item:focus {
        color: #0a58ca;
        background-color: #e9ecef;
        }        
      </style>   
      <log-gliders></log-gliders> 
      <log-sites></log-sites>  
      <div class="card h-100">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs" id="flightTabs" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab">${this.gettext('About')}</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="comment-tab" data-bs-toggle="tab" data-bs-target="#comment" type="button" role="tab">${this.gettext('Comment')}</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="modify-tab" data-bs-toggle="tab" data-bs-target="#modify" type="button" role="tab">${this.gettext('Modify')}</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="share-tab" data-bs-toggle="tab" data-bs-target="#share" type="button" role="tab">${this.gettext('Share')}</button>
            </li>
            <!-- Dropdown -->
            <li class="nav-item dropdown" role="presentation">
                <button class="nav-link dropdown-toggle" data-bs-toggle="dropdown" type="button" role="tab">${this.gettext('More')}...</button>
                <ul class="dropdown-menu">
                <li><a class="dropdown-item" data-bs-toggle="tab" href="#stats">${this.gettext('Statistics')}</a></li>
                <li><a class="dropdown-item" data-bs-toggle="tab" href="#tags">${this.gettext('Tag / Untag')}</a></li>
                </ul>
            </li>
          </ul>
        </div>
        <div class="card-body tab-content" id="flightTabsContent">
          
          <!-- Onglet Généralités -->
          <div class="tab-pane fade show active" id="general" role="tabpanel">
            <div class="d-flex flex-row gap-4 align-items-center mb-2">                
                    <span id="tag">Une ligne pour le libellé éventuel du tag</span>             
            </div>            
            <div class="d-flex flex-row gap-4 align-items-center mb-2">                
                    <strong id="site">PLANFAIT</strong> 
                    <span id="glider">IKUMA 3 P</span>  
                    <span><strong id="pilot-label">Pilote :</strong> <span id="pilot-value">BERNARD DUPONT</span></span>            
            </div>
            <div class="d-flex flex-row gap-4 align-items-center mb-2">
              <span id="takeoff">
                <strong id="takeoff-label">${this.gettext('Take off')} :</strong> <span id="takeoff-hour">14h05</span>
              </span>
              <span id="landing">
                <strong id="landing-label">${this.gettext('Landing')} :</strong> <span id="landing-hour">15h17</span>
              </span>
              <span id="duration">
                <strong id="duration-label">${this.gettext('Duration')} :</strong> <span id="duration-value">1h12</span>
              </span>
            </div>
            <div class="d-flex flex-row gap-4 align-items-center mb-2">
              <span id="alt-gps">
                <strong id="alt-label">${this.gettext('Max GPS alt')} :</strong> <span id="alt-value">14h05</span>
              </span>
              <span id="vario">
                <strong id="vario-label">${this.gettext('Max climb')} :</strong> <span id="vario-value">6m/s</span>
              </span>
              <span id="mini">
                <strong id="mini-label">${this.gettext('Min GPS alt')} :</strong> <span id="mini-value">967 m</span>
              </span>              
            </div>      
            <div class="d-flex flex-row gap-4 align-items-center mb-2">
              <span id="score">
                <strong id="score-label">${this.gettext('Score')} :</strong>
                <span id="score-value">75 km ajouter points et bouton si null</span>
                <button id="score-calc-btn" class="btn btn-sm btn-outline-success ms-2">${this.gettext('Compute')}</button>
              </span>
            </div>
            <button class="btn btn-sm btn-outline-primary me-2">${this.gettext('Add photo')}</button>
            <button class="btn btn-sm btn-outline-danger">${this.gettext('Remove photo')}</button>
          </div>
          
          <!-- Onglet Commentaire -->
          <div class="tab-pane fade" id="comment" role="tabpanel">
            <textarea class="form-control mb-2 comment-placeholder" rows="4" id="comment-input" placeholder="Commentaire du vol #ID"></textarea>
            <button class="btn btn-sm btn-secondary me-2" id="comment-delete-btn">${this.gettext('Cancel')}</button>
            <button class="btn btn-sm btn-primary" id="comment-submit-btn">${this.gettext('OK')}</button>
          </div>
      <style>
        .comment-placeholder::placeholder {
          font-style: italic;
          font-size: 0.75em;
        }
      </style>
          
          <!-- Onglet Modification -->
          <div class="tab-pane fade" id="modify" role="tabpanel">
            <div class="d-flex flex-row gap-2 mb-2">
              <button class="btn btn-sm btn-outline-primary" id="change-glider-btn">${this.gettext('Change glider')}</button>
              <button class="btn btn-sm btn-outline-primary" id="change-site-btn">${this.gettext('Change site')}</button>
            </div>
            <div class="mb-2">
              <button class="btn btn-sm btn-outline-danger" id="delete-btn">${this.gettext('Delete')}</button>
            </div>
            <div class="d-flex flex-row gap-2">
              <button class="btn btn-sm btn-outline-warning" id="edit-duplicate-btn">${this.gettext('Edit/Duplicate')}</button>
              <button class="btn btn-sm btn-outline-dark" id="merge-btn">${this.gettext('Merge flights')}</button>
            </div>
          </div>
          
          <!-- Onglet Partage -->
          <div class="tab-pane fade" id="share" role="tabpanel">
            <button class="btn btn-sm btn-outline-secondary me-2">${this.gettext('IGC export')}</button>
            <button class="btn btn-sm btn-outline-secondary me-2">${this.gettext('GPX export')}</button>
            <button class="btn btn-sm btn-outline-secondary">${this.gettext('Mail export')}</button>
          </div>
          
          <!-- Onglet Statistiques -->
          <div class="tab-pane fade" id="stats" role="tabpanel">
            <p><strong>${this.gettext('Glider flight time')}</strong> 128 h</p>
            <p><strong>${this.gettext('Totals for the selection')} :</strong> 56 h</p>
            <button class="btn btn-sm btn-outline-primary">${this.gettext('Overview')}</button>
          </div>
          
          <!-- Onglet Tag/Untag -->
          <div class="tab-pane fade" id="tags" role="tabpanel">
            <div class="d-flex gap-3">
              <i class="bi bi-star fs-4 text-warning" role="button"></i>
              <i class="bi bi-flag fs-4 text-danger" role="button"></i>
              <i class="bi bi-heart fs-4 text-danger" role="button"></i>
              <i class="bi bi-bookmark fs-4 text-primary" role="button"></i>
              <i class="bi bi-tag fs-4 text-success" role="button"></i>
            </div>
          </div>
        </div>
      </div>
      `;
  }

    setupEventListeners() {
        document.querySelector('log-table').addEventListener('row-selected', (event) => {
            this.rowData = event.detail.rowData;
            this.dbId = this.rowData.V_ID;
            this.rowIndex = event.detail.rowIndex;    
            const dbFlight = event.detail.dbFlight;
            console.log(this.rowData.V_Site+' '+this.rowData.V_Engin+' '+this.rowData.Day + ' ' + this.rowData.Hour);
            this.updateDetails(dbFlight);
        });

        // Ajout listener pour le bouton de validation du commentaire
        const commentSubmitBtn = this.querySelector('#comment-submit-btn');
        if (commentSubmitBtn) {
          commentSubmitBtn.addEventListener('click', () => this.updateComment());
        }

        const commentDeleteBtn = this.querySelector('#comment-delete-btn');
        if (commentDeleteBtn) {
          commentDeleteBtn.addEventListener('click', () => this.deleteComment());
        }

        const changeGliderBtn = this.querySelector('#change-glider-btn');
        if (changeGliderBtn) {
          changeGliderBtn.addEventListener('click', () => {
            this.querySelector('log-gliders').open(this.rowData);             
          });
        }

        const changeSiteBtn = this.querySelector('#change-site-btn');
        if (changeSiteBtn) {
          changeSiteBtn.addEventListener('click', () => {
            this.querySelector('log-sites').open(this.rowData);             
          });
        }

        const deleteBtn = this.querySelector('#delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {   
            this.deleteFlight(this.rowData.V_ID);
          });
        }
    }

    updateDetails(dbFlight) {
        // Met à jour les détails affichés dans le composant en fonction de rowData
        if (!this.rowData) return;
        this.querySelector('#site').textContent = this.rowData.V_Site || 'N/A';
        this.querySelector('#glider').textContent = this.rowData.V_Engin || 'N/A';
        this.querySelector('#pilot-label').textContent = this.gettext('Pilot')
        if (dbFlight.V_Track != null) {
            this.querySelector('#pilot-value').textContent = dbFlight.V_Track.info.pilot || 'N/A';
           // console.log('Alt max Gps'+dbFlight.V_Track.stat.maxalt.gps+'m')
            this.querySelector('#alt-value').textContent = dbFlight.V_Track.stat.maxalt.gps+'m' || 'N/A';
            this.querySelector('#vario-value').textContent = dbFlight.V_Track.stat.maxclimb+'m/s' || 'N/A';
            this.querySelector('#mini-value').textContent = dbFlight.V_Track.stat.maxsink+'m/s' || 'N/A';
        } else {
            this.querySelector('#pilot-value').textContent = '';
            this.querySelector('#alt-value').textContent = '';
            this.querySelector('#vario-value').textContent = '';
            this.querySelector('#mini-value').textContent = '';
        }
        this.querySelector('#takeoff-label').innerHTML = this.gettext('Take off') + ' :';
        this.querySelector('#takeoff-hour').textContent = this.rowData.Hour || 'N/A';
        this.querySelector('#landing-label').innerHTML = this.gettext('Landing') + ' :';
        this.querySelector('#landing-hour').textContent = this.rowData.Hour || 'N/A';
        this.querySelector('#duration-label').innerHTML = this.gettext('Duration') + ' :';
        this.querySelector('#duration-value').textContent = this.rowData.Duree || 'N/A';
        this.querySelector('#alt-label').innerHTML = this.gettext('Max GPS alt') + ' :';
        this.querySelector('#vario-label').innerHTML = this.gettext('Max climb') + ' :';
        this.querySelector('#mini-label').innerHTML = this.gettext('Max sink') + ' :';
        this.querySelector('#comment-delete-btn').innerHTML = this.gettext('Delete');
        const commentInput = this.querySelector('#comment-input');
        if (commentInput) {
          // Met à jour le placeholder dynamiquement
          commentInput.placeholder = this.gettext('Enter or edit the comment, then confirm...');
        }
        if (this.rowData.V_Commentaire && this.rowData.V_Commentaire.trim() !== '') {
          if (commentInput) {
            commentInput.value = this.rowData.V_Commentaire || '';
          }
          // Affiche l'onglet Commentaire par défaut
          const commentTab = this.querySelector('#comment-tab');
          if (commentTab) {
            commentTab.click();
          }
        } else {
          if (commentInput) {
            commentInput.value = '';
          }
          const generalTab = this.querySelector('#general-tab');
          if (generalTab) {
            generalTab.click();
          }
        }
    }   

    deleteComment() {
        const commentInput = this.querySelector('#comment-input');
        if (commentInput) {
          commentInput.value = '';
        }
        this.updateComment()
    } 

    deleteFlight(V_ID) {
        if (V_ID != null) {
            if (confirm(this.gettext('Are you sure you want to continue')+' ?')) {
                this.dispatchEvent(new CustomEvent('flight-deleted', {
                    detail: {
                        rowIndex: this.rowIndex,
                        V_ID: V_ID
                    },
                    bubbles: true,
                    composed: true
                }));       
            }
        } 
    }

    updateComment() {
        const newComment = this.querySelector('#comment-input').value;
        if (this.dbId != null) {
            this.dispatchEvent(new CustomEvent('com-updated', {
                detail: {
                    rowIndex: this.rowIndex,
                    V_ID: this.rowData.V_ID,
                    V_Commentaire: newComment
                },
                bubbles: true,
                composed: true
            }));       
        } 
    }    

    setI18n(i18n) {
      this.i18n = i18n;
      this.render(); // Re-render to update texts
      this.setupEventListeners(); // Indispensable, render remplace le DOM et détruit les listeners
      // Transfert de i18n aux enfants APRES le this.render()
      this.querySelectorAll('log-gliders, log-sites').forEach(el => {
        if (typeof el.setI18n === 'function') {
          el.setI18n(this.i18n);
        } else {
          el.i18n = this.i18n;
        }    
      });      
    }  

    gettext(key) {
        return this.i18n[key] || key;
    }      

}

customElements.define("log-details", LogDetails);
