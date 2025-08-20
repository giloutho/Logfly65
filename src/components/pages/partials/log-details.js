class LogDetails extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
      this.innerHTML = /*html */`
      <style>
        :host {
          display: block;
          font-size: 0.85rem; /* taille réduite seulement ici */
        }
        .nav-link {
          font-size: 0.8rem;
        }
        .tab-content {
          font-size: 0.8rem;
        }
        button {
          font-size: 0.8rem;
        }
      </style>      
      <div class="card h-100">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs" id="flightTabs" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab">Généralités</button>
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
            <li class="nav-item">
              <button class="nav-link" id="stats-tab" data-bs-toggle="tab" data-bs-target="#stats" type="button" role="tab">Statistiques</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="tag-tab" data-bs-toggle="tab" data-bs-target="#tag" type="button" role="tab">Tag/Untag</button>
            </li>
          </ul>
        </div>
        <div class="card-body tab-content" id="flightTabsContent">
          
          <!-- Onglet Généralités -->
          <div class="tab-pane fade show active" id="general" role="tabpanel">
            <p><strong>Décollage :</strong> 14h05</p>
            <p><strong>Atterrissage :</strong> 15h17</p>
            <p><strong>Durée :</strong> 1h12</p>
            <p><strong>Vario max :</strong> +4.2 m/s</p>
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
          <div class="tab-pane fade" id="tag" role="tabpanel">
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
}

customElements.define("log-details", LogDetails);
