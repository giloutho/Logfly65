import('./components/pages/error-page.js');

const app = document.getElementById("app");

window.addEventListener("DOMContentLoaded", async () => {
  console.log('Appel getStartStatus...');
  const startParam = await window.electronAPI.getStartStatus();
  console.log('Renderer : start status check result : ', startParam);
  if (!startParam.success) {
    console.error('Error while checking start status: ', startParam.globalError);
    app.innerHTML = "";
    const errorPage = document.createElement("error-page");
    errorPage.startParam = startParam; // <-- Passe l'objet ici
    app.appendChild(errorPage);
    return; // On n'appelle pas renderRoute
  }
  // Sinon, on lance le routage normal
  renderRoute();
});

function renderRoute() {
  // Pour remttre logbook par defaut mettre "#home" à la la place de "#import"
  const hash = window.location.hash || "#settings";
  if (window._lastRoute === hash) {
    console.log('renderRoute ignoré, route déjà affichée :', hash);
    return;
  }
  window._lastRoute = hash;
  console.log('renderRoute appelé pour :', hash);
  app.innerHTML = "";

  app.appendChild(document.createElement("app-menu"));

  const body = document.createElement("app-body");
  body.setAttribute("route", hash.substring(1));
  app.appendChild(body);

 // app.appendChild(document.createElement("app-footer"));
}

window.addEventListener("hashchange", renderRoute);
//window.addEventListener("DOMContentLoaded", renderRoute);
