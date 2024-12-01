const { app, BrowserWindow, ipcMain, Menu, nativeImage } = require('electron');
const path = require('path');
const { executeOptimizations } = require('./optimizations');

let mainWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('Only one instance can run at the same time.');
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    const createWindow = () => {
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 700,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            icon: path.join(__dirname, '/img/ic-icon.ico')
        });

        Menu.setApplicationMenu(null);

        mainWindow.loadFile('index.html');

        mainWindow.on('closed', () => {
            console.log('Window closed event triggered.');
        });
    };

    app.whenReady().then(() => {
        console.log('App is ready');
        createWindow();

        const icon = nativeImage.createFromPath(path.join(__dirname, '/img/ic-icon.ico'));
        app.setIcon(icon);
    });

    app.on('window-all-closed', () => {
        console.log('All windows closed');
        if (process.platform !== 'darwin') {
            console.log('Quitting app');
            app.quit();
        }
    });

    app.on('activate', () => {
        console.log('App activated');
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    ipcMain.on('execute-operations', async (event, operations) => {
        console.log('Received execute-operations message:', operations);
        try {
            const updateCurrentOperation = (operation) => {
                console.log('Updating current operation:', operation);
                event.reply('current-operation', operation);
            };

            console.log('Starting executeOptimizations');
            const results = await executeOptimizations(operations, updateCurrentOperation);
            console.log('Optimizations completed, sending results');
            event.reply('operation-results', results);
        } catch (error) {
            console.error('Error during optimizations:', error);
            event.reply('operation-error', error.message);
        }
    });

    ipcMain.on('close-app', (event) => {
        console.log('Received close-app message in main process');
        event.reply('app-closing');
        try {
            console.log('Attempting to quit the app');
            app.quit();
        } catch (error) {
            console.error('Error while quitting the app:', error);
            console.log('Forcing app to exit');
            app.exit(0);
        }
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
    });

    app.on('will-quit', () => {
        console.log('App is about to quit');
    });

    app.on('quit', () => {
        console.log('App has quit');
    });

    app.setAppUserModelId('com.jqvon.icoptimizer');

    require('./dc-presence');
}