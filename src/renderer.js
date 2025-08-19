const app = document.getElementById("app");

function renderRoute() {
  const hash = window.location.hash || "#home";
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

  app.appendChild(document.createElement("app-footer"));
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", renderRoute);
