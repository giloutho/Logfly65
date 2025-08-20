class LogDetails extends HTMLElement {
  connectedCallback() {
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
              <span id="gain">
                <strong id="gain-label">Gain max :</strong> <span id="gain-value">967 m</span>
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
        console.log(rowData.V_Site+' '+rowData.V_Engin+' '+rowData.Day + ' ' + rowData.Hour);
        // Changement d'aspect de l'icône commentaire
        const commentImg = this.querySelector('#bt-comment img');
        if (rowData.V_Commentaire && rowData.V_Commentaire.trim() !== '') {
            console.log("Commentaire présent "+rowData.V_Commentaire);
        } 
    });
}  
}

customElements.define("log-details", LogDetails);
