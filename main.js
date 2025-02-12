const { app, BrowserWindow, ipcMain, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { executeOptimizations } = require('./optimizations');

let mainWindow

// Ensure only one instance runs
const Locked = app.requestSingleInstanceLock()

if (!Locked) {
    console.log('Only one instance can run at the same time')
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    // Create main window
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
        })

        mainWindow.webContents.setWindowOpenHandler((details) => {
            shell.openExternal(details.url) // Open links in browser
            return { action: 'deny' }
        })

        Menu.setApplicationMenu(null)

        mainWindow.loadFile('index.html')

        mainWindow.on('closed', () => {
            console.log('Window closed event triggered')
        })
    }

    app.whenReady().then(() => {
        console.log('App is ready')
        createWindow()

        const icon = nativeImage.createFromPath(path.join(__dirname, '/img/ic-icon.ico'))
        app.setIcon(icon)
    })

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
        console.log('All windows closed, quitting app')
        app.quit()
    })

    // Recreate window if app is reopened
    app.on('activate', () => {
        console.log('App activated')
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    // Handle execution requests
    ipcMain.on('execute-operations', async (event, operations) => {
        console.log('Received execute-operations:', operations)
        try {
            const updateCurrentOperation = (operation) => {
                console.log('Updating operation:', operation)
                event.reply('current-operation', operation)
            }

            console.log('Starting executeOptimizations')
            const results = await executeOptimizations(operations, updateCurrentOperation)
            console.log('Optimizations completed, sending results')
            event.reply('operation-results', results)
        } catch (error) {
            console.error('Error during optimizations:', error)
            event.reply('operation-error', error.message)
        }
    })

    // Handle close request
    ipcMain.on('close-app', (event) => {
        console.log('Received close-app message')
        event.reply('app-closing')
        try {
            console.log('Quitting app')
            app.quit()
        } catch (error) {
            console.error('Error quitting app:', error)
            console.log('Forcing exit')
            app.exit(0)
        }
    })

    // Handle restart request
    ipcMain.on('restart-button', (event) => {
        console.log('Received restart message')
        try {
            console.log('Restarting PC')
            runCommand('shutdown /r /t 1')
            event.reply('restarting', 'System is restarting now')
        } catch (error) {
            console.error('Error restarting PC:', error)
            event.reply('restart-error', `Error: ${error.message}`)
        }
    })

    // Handle break request
    ipcMain.on('break-button', (event) => {
        console.log('Received break message')
        try {
            console.log('Stopping optimizations')
            const optimizations = require('./optimizations')
            optimizations.stopOperations()
            event.reply('operations-stopped', 'Optimization operations have been stopped')
        } catch (error) {
            console.error('Error stopping optimizations:', error)
            event.reply('break-error', `Error: ${error.message}`)
        }
    })

    // Handle debug mode launch
    ipcMain.on('launch-debug', () => {
        const vbsPath = path.join(__dirname, 'debug', 'launch-debug.vbs')
        exec(`cscript "${vbsPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing VBS script: ${error.message}`)
                return
            }
            if (stderr) {
                console.error(`VBS script stderr: ${stderr}`)
                return
            }
            console.log(`VBS script stdout: ${stdout}`)
        })
    })

    function runCommand(command) {
        exec(command, (error) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`)
            }
        })
    }

    // Handle errors
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error)
    })

    app.on('will-quit', () => {
        console.log('App is about to quit')
    })

    app.on('quit', () => {
        console.log('App has quit')
    })

    app.setAppUserModelId('com.jqvon.icoptimizer')

    require('./dc-presence')
}
