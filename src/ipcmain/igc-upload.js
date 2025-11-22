const { app } = require('electron')
const fs = require('fs');
const path = require('path');
const https = require('https');

function uploadIgcToServer(igcText) {
    //console.log('Uploading IGC to server...');
    return new Promise((resolve) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
        const tempFileName = path.join(app.getPath('temp'), 'flyxc.igc');
        fs.writeFileSync(tempFileName, igcText);

        const fileContent = fs.readFileSync(tempFileName);
        
        // Construction du payload en Buffer pour éviter les problèmes d'encodage
        const payload = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="logfly"; filename="flyxc.igc"\r\n`),
            Buffer.from(`Content-Type: text/plain\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const options = {
            hostname: 'logfly.org',
            path: '/Visu/jsupload.php',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': payload.length
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // console.log('Réponse serveur:', data);
                if (data && data.trim().startsWith('OK:')) {
                    const filename = data.trim().substring(3);
                    resolve({ success: true, filename });
                } else {
                    resolve({ success: false, message: data.trim() || 'Erreur inconnue du serveur.' });
                }
            });
        });

        req.on('error', (e) => {
            console.error('Erreur upload:', e);
            resolve({ success: false, message: 'Erreur upload: ' + e.message });
        });

        req.setTimeout(30000, () => {
            console.error('Timeout upload');
            resolve({ success: false, message: 'Timeout upload' });
            req.abort();
        });

        //console.log('Payload envoyé, attente réponse...');
        req.write(payload);
        req.end();
    });
}

module.exports.uploadIgcToServer = uploadIgcToServer;