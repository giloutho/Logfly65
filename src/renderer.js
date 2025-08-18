const app = document.getElementById("app");

function renderRoute() {
  const hash = window.location.hash || "#home";
  app.innerHTML = "";

  app.appendChild(document.createElement("app-menu"));

  const body = document.createElement("app-body");
  body.setAttribute("route", hash.substring(1));
  app.appendChild(body);

  app.appendChild(document.createElement("app-footer"));
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", renderRoute);
