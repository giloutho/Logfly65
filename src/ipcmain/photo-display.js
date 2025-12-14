const { ipcMain, BrowserWindow } = require('electron');

ipcMain.handle('window:photo', (event, args) => {
    const { base64Image, width, height } = args;
    
    // Crée une nouvelle fenêtre Electron
    const photoWindow = new BrowserWindow({
        width: width,
        height: height,
        resizable: true,
        backgroundColor: '#000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    
    // Charge le contenu HTML avec l'image
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    margin: 0; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    background: #000; 
                    overflow: hidden;
                }
                img { 
                    max-width: 100%; 
                    max-height: 100vh; 
                    display: block;
                }
            </style>
        </head>
        <body>
            <img src="${base64Image}" />
        </body>
        </html>
    `;
    
    photoWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    return { success: true };
});