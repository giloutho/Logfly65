export const routes = {
  home: {
    module: () => import("./pages/home-page.js"),
    tag: "home-page",
  },
  import: {
    module: () => import("./pages/import-page.js"),
    tag: "import-page",
  },
  settings: {
    module: () => import("./pages/settings-page.js"),
    tag: "settings-page",
  },
  utilities: {
    module: () => import("./pages/utils-page.js"),
    tag: "utils-page",
  },  
  notfound: {
    module: () => import("./pages/notfound-page.js"),
    tag: "notfound-page",
  },
};

// Fonction utilitaire pour obtenir une route
export function getRouteConfig(routeName) {
  return routes[routeName] || routes["notfound"];
}

/**
 * Injecte le composant de la route dans le conteneur cible et diffuse i18n si besoin
 * @param {string} routeName
 * @param {HTMLElement} container
 * @param {object} i18n
 */
export async function loadRoute(routeName, container, i18n) {
  const route = getRouteConfig(routeName);
  await route.module(); // Charge dynamiquement le module
  container.innerHTML = `<${route.tag}></${route.tag}>`;
  // Diffuse i18n si fourni
  //if (i18n) {
    const page = container.querySelector(route.tag);
    if (page && typeof page.setI18n === 'function') {
      page.setI18n(i18n);
    } else if (page && 'i18n' in page) {
      page.i18n = i18n;
    }
  //}
}
