const electron = require('electron');
const server = require('./server/server.js');

const app = electron.app;
const protocol = electron.protocol
const BrowserWindow = electron.BrowserWindow;

const path = require('path');

let mainWindow;

function init() {
    createProtocol();
    createWindow();
}

function createProtocol() {
    const protocolName = 'safe'

    protocol.registerFileProtocol(protocolName, (request, callback) => {
        const url = request.url.replace(`${protocolName}://`, '')
        try {
            return callback(decodeURIComponent(url))
        }
        catch (error) {
            console.error(error)
        }
    })
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 900,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: __dirname + '/favicon.ico'
    });

    mainWindow.loadURL('http://localhost:9002/');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
app.on('ready', init);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});