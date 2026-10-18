const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#0F172A',
    title: 'HydroGraph AI',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  })
  if (process.env.VITE_DEV) win.loadURL('http://localhost:5173')
  else win.loadFile(path.join(__dirname, '../dist/index.html'))
}
app.whenReady().then(createWindow)
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
