const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipcMain = require('electron').ipcMain
const dialog = require('electron').dialog
//const fs = require('fs')
let win

// open a window
openWindow = (type) => {
  win = new BrowserWindow({
    width: 1500, // 600
    height: 1070,
    //show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      //preload: './local-storage-sync.js',
    },
  })
  //============================================
  win.webContents.openDevTools() // Отладка
  //============================================
  if (type === 'tree') {
    //win.loadFile('./preload.js')
    win.loadFile('./tree.html') // image window
  } else {
    win.loadFile('./tree.html') // default window
  }
}

// when app is ready, create a window
app.on('ready', () => {
  openWindow() // open default window
})

// when all windows are closed, quit the application
app.on('window-all-closed', (event) => {
  if (process.platform !== 'darwin') {
    console.log('Quit main window')
    app.quit() // exit
  }
})

// when application is activated, open default window
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    openWindow() // open default window
  }
})
//========================================= Загрузить избранные
ipcMain.on('open-favor-dialog', (event) => {
  let filePath = path.join(__dirname, 'favorites')
  if (filePath.includes('\\app.asar\\'))
    filePath = filePath.replace('\\app.asar\\', '\\')

  dialog
    .showOpenDialog({
      title: 'Загрузить избранные',
      defaultPath: filePath,
      buttonLabel: 'Выбрать',
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'JSON', extensions: ['json'] },
      ],
      properties: ['openFile', 'showHiddenFiles'],
    })
    .then((data) => {
      event.sender.send('open-selected-favor', data.filePaths)
    })
})
//=========================================
ipcMain.on('send:load-tree', () => {
  console.log('[message received]', 'send:rewrite-file')
  app.quit() // exit
  openWindow('tree') // open tree window
})
//=========================================
// ipcMain.on('store-custom-data:OK', () => {
//   console.log('store-custom-data:OK')
//   app.quit() // exit
// })

//=========================================
