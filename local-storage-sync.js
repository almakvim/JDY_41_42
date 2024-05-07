const { ipcRenderer } = require('electron')

window.addEventListener('beforeunload', () => {
  ipcRenderer.sendSync('local-storage', JSON.stringify(localStorage))
})
