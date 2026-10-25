const { app, BrowserWindow, Menu, session, shell } = require('electron')
const path = require('path')

const isDev = Boolean(process.env.VITE_DEV)

/**
 * La ventana carga archivos locales (origen `file://`, que el navegador envía como «null») y el
 * backend solo permite los orígenes de la web. Se añaden las cabeceras CORS únicamente a las
 * respuestas de la API, sin tocar la configuración del servidor ni abrir el resto de la web.
 */
function allowApiCalls() {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://*/api/*', 'http://localhost:*/api/*'] },
    (details, callback) => {
      const headers = Object.fromEntries(
        Object.entries(details.responseHeaders).filter(
          ([name]) => !name.toLowerCase().startsWith('access-control-allow-'),
        ),
      )
      headers['Access-Control-Allow-Origin'] = ['*']
      headers['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS']
      headers['Access-Control-Allow-Headers'] = ['Content-Type, Accept-Language']
      callback({ responseHeaders: headers })
    },
  )
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#0F172A',
    title: 'HydroGraph AI',
    icon: path.join(__dirname, '../build/icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  // Los enlaces externos se abren en el navegador, no dentro de la aplicación
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  if (isDev) win.loadURL('http://localhost:5173')
  else win.loadFile(path.join(__dirname, '../dist/index.html'))
}

// Una sola ventana: abrir la aplicación otra vez enfoca la que ya existe
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })
  app.whenReady().then(() => {
    if (!isDev && process.platform !== 'darwin') Menu.setApplicationMenu(null)
    allowApiCalls()
    createWindow()
  })
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
  app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
}
