const electron = require('electron');

window.addEventListener('message', event => {
  electron.ipcRenderer.send('screenshot', event.data);
});
