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

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const log = require('electron-log/main');

let langjson

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // Résolutions écran les plus courantes
    // Écran ordinateur de bureau ou portable / 16:9 (HD 900) / 1600 × 900 px
    // Écran ordinateur de bureau ou portable / 16:9 (HD 768) / 1366 × 768 px
    // Écran ordinateur de bureau / 5:4 (SXGA) / 1280 × 1024 px
    width: 1366,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  console.log('Chrome : ',process.versions.chrome,' Electron : ',process.versions.electron,' Node : ',process.versions.node);

  loadMainProcesses()
  loadLanguage();
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

function loadLanguage() {
  let currLangFile = '../lang/'
  //let currLang = store.get('lang')
  let currLang = 'fr'
  if (currLang == undefined || currLang == null || currLang == '') {
    currLang = 'en'
  } 
  try {    
    if (currLang != undefined && currLang != 'en') {
      currLangFile += currLang+'.json'
      currLangFile = path.join(__dirname, 'lang', currLang + '.json');
      let content = fs.readFileSync(currLangFile);
      langjson = JSON.parse(content);
    } else {
      langjson = {}
    }
  } catch (error) {
    log.error('[main.js] Error while loading : '+currLangFile+' error :'+error)
  }  
}

ipcMain.handle('lang:msg', async (event, args) => {
  return langjson
});

// Require each JS file in the ipcmain folder
function loadMainProcesses () {
  const ipcMainPath = path.join(__dirname, 'ipcmain');

  fs.readdirSync(ipcMainPath).forEach(file => {
    if (file.endsWith('.js')) {
      const modulePath = path.join(ipcMainPath, file);
      require(modulePath); // Charge le module
    }
  });
}
