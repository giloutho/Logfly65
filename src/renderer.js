import('./components/pages/error-page.js');
import { loadRoute } from './components/router.js';

const app = document.getElementById("app");
let i18n = null; 

window.addEventListener("DOMContentLoaded", async () => {
  const startParam = await window.electronAPI.getStartStatus();

  // Charger le dictionnaire de langue une seule fois
  i18n = await window.electronAPI.langmsg();

  if (!startParam.success) {
    console.error('Error while checking start status: ', startParam.globalError);
    app.innerHTML = "";
    const errorPage = document.createElement("error-page");
    errorPage.startParam = startParam;
    if (typeof errorPage.setI18n === 'function') {
      errorPage.setI18n(i18n);
    } else {
      errorPage.i18n = i18n;
    }
    app.appendChild(errorPage);
    return;
  }
  // Sinon, on lance le routage normal
  renderRoute();
});

function renderRoute() {
  const hash = window.location.hash.replace('#', '') || 'home';
  loadRoute(hash, app, i18n);
}

window.addEventListener("hashchange", renderRoute);
// Supprime ce deuxième DOMContentLoaded, il n'est plus utile
// window.addEventListener("DOMContentLoaded", renderRoute);
