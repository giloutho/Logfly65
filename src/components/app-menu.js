export class AppMenu extends HTMLElement {
  connectedCallback() {
    this.innerHTML = /*html */`
      <style>
        .top-navbar {
          background: linear-gradient(135deg, #1a6dcc 0%, #0a2540 100%) !important;
          font-size: 1rem !important;
        }
        .top-navbar * {
          font-size: 1rem !important;
        }
        /* Concerne le logo*/
        .navbar-brand img {
          height: 2.5rem;
          max-height: 100%;
          width: auto;
        }        
        /*. centrage des icônes */
        .navbar-nav.center-icons {
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 2.5rem;
        }
        .navbar-nav.center-icons .nav-link {
          padding: 0;
        }
        .navbar-nav.center-icons img {
          height: 2.1rem;
          width: 2.1rem;
          object-fit: contain;
          display: block;
        }        
        /* Mise en évidence de l'icône active */
        .navbar-nav.center-icons .nav-link.active-icon {
          background: linear-gradient(135deg, #e0f0ff 0%, #b3d8ff 100%);
          border-radius: 0.7rem;
          box-shadow: 0 0 0 3px #2196f3aa;
          transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
          transform: scale(1.18);
        }
        .navbar-nav.center-icons .nav-link.active-icon img {
          filter: drop-shadow(0 0 4px #2196f3cc);
        }   
      </style>    
      <nav class="navbar navbar-expand-lg navbar-dark top-navbar">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <img src="./static/images/Logo_7.png" alt="Logo" />
          </a>
          <ul class="navbar-nav center-icons mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="#home" title="Carnet de vol">
                <img src="./static/icons/mnu-logbook.png" alt="Logbook" />
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#overview" title="Vue d'ensemble">
                <img src="./static/icons/mnu-overview1.png" alt="Overview" />
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#import" title="Import">
                <img src="./static/icons/mnu-import.png" alt="Import" />
              </a>
            </li>

                <li class="nav-item">
                    <a class="nav-link" href="#external" title="Trace externe">
                        <img src="./static/icons/mnu-external.png" alt="Trace externe" height="32">
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#statistics" title="Statistiques">
                        <img src="./static/icons/mnu-stat.png" alt="Statistiques" height="32">
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#site" title="Sites">
                        <img src="./static/icons/mnu-site.png" alt="Sites" height="32">
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#airspaces" title="Espaces aériens">
                        <img src="./static/icons/mnu-airspaces.png" alt="Espaces aériens" height="32">
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#waypoint" title="Points de cheminement">
                        <img src="./static/icons/mnu-waypoint.png" alt="Points de cheminement" height="32">
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#equipment" title="Équipement">
                        <img src="./static/icons/mnu-equipment.png" alt="Équipement" height="32">
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#xcnav" title="XC Nav">
                        <img src="./static/icons/mnu-xcnav.png" alt="XC Nav" height="32">
                    </a>
                </li>
            <li class="nav-item">
              <a class="nav-link" href="#settings" title="Réglages">
                <img src="./static/icons/mnu-settings.png" alt="Réglages" />
              </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#settings" title="Support">
                    <img src="./static/icons/mnu-support.png" alt="Support" height="32">
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#utilities" title="Utilitaires">
                    <img src="./static/icons/mnu-utilities.png" alt="Utilitaires" height="32">
                </a> 
            </li>           
          </ul>          
          <button id="fullscreen-toggle" class="btn btn-outline-light ms-auto" title="Plein écran">
            <i class="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
      </nav>
    `;

    // Gestion de l'icône active
    const navLinks = this.querySelectorAll('.navbar-nav.center-icons .nav-link');
    const setActiveIcon = (hash) => {
      navLinks.forEach(link => {
        if (link.getAttribute('href') === hash) {
          link.classList.add('active-icon');
        } else {
          link.classList.remove('active-icon');
        }
      });
    };    

    // Au clic sur une icône
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        setActiveIcon(link.getAttribute('href'));
      });
    });    

    // À l'initialisation, sur la page courante
    setActiveIcon(window.location.hash || '#import');

    // la navigation est fondée sur le hash dans l'URL
    window.addEventListener('hashchange', () => {
      setActiveIcon(window.location.hash);
    });    

    // Ajout du comportement toggle plein écran
    this.querySelector('#fullscreen-toggle').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    // Ajuste dynamiquement le nombre de lignes de log-table en plein écran
    document.addEventListener('fullscreenchange', () => {
      const logTable = document.querySelector('log-table');
      if (logTable) {
        if (document.fullscreenElement) {
          // Plein écran
          const availableHeight = window.innerHeight;
          // A  priori le calcul laisse de la marge
          // Estimation : chaque ligne ~40px, on laisse 200px pour le reste
          // On rajoute des lignes supplémentaires pour le plein écran
          // à vérifier sur d'autres appareils
          const addLines = 4
          const lines = Math.max(5, Math.floor((availableHeight - 200) / 40) + addLines);
          logTable.setTableLines(lines);
        } else {
          // Retour à la fenêtre normale
          logTable.setTableLines('reset');
        }
      }
    });
  }
}

customElements.define("app-menu", AppMenu);
