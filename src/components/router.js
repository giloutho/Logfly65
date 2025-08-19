export const routes = {
  home: {
    module: () => import("./pages/home-page.js"),
    tag: "home-page",
  },
  import: {
    module: () => import("./pages/import-page.js"),
    tag: "import-page",
  },
  about: {
    module: () => import("./pages/about-page.js"),
    tag: "about-page",
  },
  settings: {
    module: () => import("./pages/settings-page.js"),
    tag: "settings-page",
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
