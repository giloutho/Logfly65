// scripts/copy-assets.js
const fs = require("fs");
const path = require("path");

const targetDir = path.resolve("./src/static");

const filesToCopy = [
  // jQuery
  { src: "node_modules/jquery/dist/jquery.min.js", dest: "jquery.min.js" },

  // Bootstrap
  { src: "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js", dest: "bootstrap.bundle.min.js" },
  { src: "node_modules/bootstrap/dist/css/bootstrap.min.css", dest: "bootstrap.min.css" },

  // Bootstrap Icons
  { src: "node_modules/bootstrap-icons/font/bootstrap-icons.css", dest: "bootstrap-icons.css" },

  // DataTables core (distribution prête à l'emploi)
  { src: "node_modules/datatables.net/js/dataTables.min.js", dest: "dataTables.min.js" },
  { src: "node_modules/datatables.net-select/js/dataTables.select.min.js", dest: "dataTables.select.min.js" },

  // DataTables Bootstrap 5 integration
  { src: "node_modules/datatables.net-bs5/js/dataTables.bootstrap5.min.js", dest: "dataTables.bootstrap5.min.js" },
  { src: "node_modules/datatables.net-bs5/css/dataTables.bootstrap5.min.css", dest: "dataTables.bootstrap5.min.css" },

  // DataTables Select Plugin
  { src: "node_modules/datatables.net-select-bs5/js/select.bootstrap5.min.js", dest: "select.bootstrap5.min.js" },
  { src: "node_modules/datatables.net-select-bs5/css/select.bootstrap5.min.css", dest: "select.bootstrap5.min.css" },

  // Leaflet
  { src: "node_modules/leaflet/dist/leaflet.js", dest: "leaflet.js" },
  { src: "node_modules/leaflet/dist/leaflet.css", dest: "leaflet.css" },
];

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

filesToCopy.forEach(({ src, dest }) => {
  const sourcePath = path.resolve(src);
  const destPath = path.join(targetDir, dest);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️ Skipped (not found): ${src}`);
    return;
  }

  ensureDirExists(destPath);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Copied ${src} -> static/${dest}`);
});

console.log("✨ Tous les assets ont été copiés dans /static");
