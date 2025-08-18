// Hot reload (uniquement en dev)
if (process.env.NODE_ENV !== "production") {
  try {
    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/../node_modules/electron`),
      ignored: /node_modules|[\/\\]\./
    });
  } catch (err) {
    console.log("electron-reload non disponible", err);
  }
}

const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  console.log('Chrome : ',process.versions.chrome,' Electron : ',process.versions.electron,' Node : ',process.versions.node);

  loadMainProcesses()
  // Open the DevTools.
 // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Require each JS file in the ipcmain folder
function loadMainProcesses () {
  const ipcMainContext = require.context(
    './ipcmain',   // Chemin relatif au fichier actuel
    true,             // Inclure les sous-dossiers
    /\.js$/           // Filtre pour les fichiers .js
  );

  ipcMainContext.keys().forEach(modulePath => {
    // Charge le module
    const module = ipcMainContext(modulePath);
  });
}
