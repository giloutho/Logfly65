export class AppMenu extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">MyApp</a>
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="#home">Accueil</a></li>
            <li class="nav-item"><a class="nav-link" href="#import">Import</a></li>
            <li class="nav-item"><a class="nav-link" href="#settings">Paramètres</a></li>
            <li class="nav-item"><a class="nav-link" href="#about">À propos</a></li>
          </ul>
          <button id="fullscreen-toggle" class="btn btn-outline-light ms-auto" title="Plein écran">
            <i class="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
      </nav>
    `;

    // Ajout du comportement toggle plein écran
    this.querySelector('#fullscreen-toggle').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
  }
}

customElements.define("app-menu", AppMenu);
