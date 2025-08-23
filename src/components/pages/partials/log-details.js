class LogDetails extends HTMLElement {

  constructor() {
    super();
    this.i18n = {}; // Pour stocker les messages
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
      <div class="card h-100">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs" id="flightTabs" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab">A propos</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="comment-tab" data-bs-toggle="tab" data-bs-target="#comment" type="button" role="tab">Commentaire</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="modify-tab" data-bs-toggle="tab" data-bs-target="#modify" type="button" role="tab">Modification</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="share-tab" data-bs-toggle="tab" data-bs-target="#share" type="button" role="tab">Partage</button>
            </li>
            <!-- Dropdown -->
            <li class="nav-item dropdown" role="presentation">
                <button class="nav-link dropdown-toggle" data-bs-toggle="dropdown" type="button" role="tab">Plus...</button>
                <ul class="dropdown-menu">
                <li><a class="dropdown-item" data-bs-toggle="tab" href="#stats">Statistiques</a></li>
                <li><a class="dropdown-item" data-bs-toggle="tab" href="#tags">Tag / Untag</a></li>
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
                <strong id="takeoff-label">Décollage :</strong> <span id="takeoff-hour">14h05</span>
              </span>
              <span id="landing">
                <strong id="landing-label">Atterrissage :</strong> <span id="landing-hour">15h17</span>
              </span>
              <span id="duration">
                <strong id="duration-label">Durée :</strong> <span id="duration-value">1h12</span>
              </span>
            </div>
            <div class="d-flex flex-row gap-4 align-items-center mb-2">
              <span id="alt-gps">
                <strong id="alt-label">Alt max GPS :</strong> <span id="alt-value">14h05</span>
              </span>
              <span id="vario">
                <strong id="vario-label">Vario max :</strong> <span id="vario-value">6m/s</span>
              </span>
              <span id="mini">
                <strong id="mini-label">Vario mini :</strong> <span id="mini-value">967 m</span>
              </span>              
            </div>      
            <div class="d-flex flex-row gap-4 align-items-center mb-2">
              <span id="score">
                <strong id="score-label">Score :</strong>
                <span id="score-value">75 km ajouter points et bouton si null</span>
                <button id="score-calc-btn" class="btn btn-sm btn-outline-success ms-2">Calcul</button>
              </span>
            </div>
            <button class="btn btn-sm btn-outline-primary me-2">Ajouter photo</button>
            <button class="btn btn-sm btn-outline-danger">Supprimer photo</button>
          </div>
          
          <!-- Onglet Commentaire -->
          <div class="tab-pane fade" id="comment" role="tabpanel">
            <textarea class="form-control mb-2" rows="4" placeholder="Saisir un commentaire..."></textarea>
            <button class="btn btn-sm btn-secondary me-2">Annuler</button>
            <button class="btn btn-sm btn-primary">Valider</button>
          </div>
          
          <!-- Onglet Modification -->
          <div class="tab-pane fade" id="modify" role="tabpanel">
            <button class="btn btn-sm btn-outline-primary me-2">Changer voile</button>
            <button class="btn btn-sm btn-outline-primary me-2">Changer site</button>
            <button class="btn btn-sm btn-outline-warning me-2">Éditer / Dupliquer</button>
            <button class="btn btn-sm btn-outline-danger me-2">Supprimer</button>
            <button class="btn btn-sm btn-outline-dark">Fusionner</button>
          </div>
          
          <!-- Onglet Partage -->
          <div class="tab-pane fade" id="share" role="tabpanel">
            <button class="btn btn-sm btn-outline-secondary me-2">Exporter IGC</button>
            <button class="btn btn-sm btn-outline-secondary me-2">Exporter GPX</button>
            <button class="btn btn-sm btn-outline-secondary">Envoyer par mail</button>
          </div>
          
          <!-- Onglet Statistiques -->
          <div class="tab-pane fade" id="stats" role="tabpanel">
            <p><strong>Total voile :</strong> 128 h</p>
            <p><strong>Total sélection :</strong> 56 h</p>
            <button class="btn btn-sm btn-outline-primary">Synthèse annuelle</button>
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
            const rowData = event.detail.rowData;
            this.selectedRowData = rowData;
            this.rowIndex = event.detail.rowIndex;    
            const dbFlight = event.detail.dbFlight;
            console.log(rowData.V_Site+' '+rowData.V_Engin+' '+rowData.Day + ' ' + rowData.Hour);
            this.updateDetails(rowData, dbFlight);
            // Changement d'aspect de l'icône commentaire
            const commentImg = this.querySelector('#bt-comment img');
            if (rowData.V_Commentaire && rowData.V_Commentaire.trim() !== '') {
                console.log("Commentaire présent "+rowData.V_Commentaire);
            } 
        });
    }  

    updateDetails(rowData, dbFlight) {
        console.log(dbFlight.V_Track)
        // Met à jour les détails affichés dans le composant en fonction de rowData
        if (!rowData) return;
        this.querySelector('#site').textContent = rowData.V_Site || 'N/A';
        this.querySelector('#glider').textContent = rowData.V_Engin || 'N/A';
        this.querySelector('#pilot-label').textContent = this.gettext('Pilot')
        this.querySelector('#pilot-value').textContent = dbFlight.V_Track.info.pilot || 'N/A';
        this.querySelector('#takeoff-label').innerHTML = this.gettext('Take off') + ' :';
        this.querySelector('#takeoff-hour').textContent = rowData.Hour || 'N/A';
        this.querySelector('#landing-label').innerHTML = this.gettext('Landing') + ' :';
        this.querySelector('#landing-hour').textContent = rowData.Hour || 'N/A';
        this.querySelector('#duration-label').innerHTML = this.gettext('Duration') + ' :';
        this.querySelector('#duration-value').textContent = rowData.Duree || 'N/A';
        this.querySelector('#alt-label').innerHTML = this.gettext('Max GPS alt') + ' :';
        this.querySelector('#alt-value').textContent = dbFlight.V_Track.stat.maxalt.gps+'m' || 'N/A';
        this.querySelector('#vario-label').innerHTML = this.gettext('Max climb') + ' :';
        this.querySelector('#vario-value').textContent = dbFlight.V_Track.stat.maxclimb+'m/s' || 'N/A';
        this.querySelector('#mini-label').innerHTML = this.gettext('Max sink') + ' :';
        this.querySelector('#mini-value').textContent = dbFlight.V_Track.stat.maxsink+'m/s' || 'N/A';
    }   

    async langRequest() {
        this.i18n = await window.electronAPI.langmsg();
        console.log('Overview -> '+this.i18n['Overview'])
    }  

    gettext(key) {
        return this.i18n[key] || key;
    }      

}

customElements.define("log-details", LogDetails);
