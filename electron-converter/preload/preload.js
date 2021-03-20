const electron = require('electron');

window.addEventListener('message', event => {
  console.log('renderer to main', event.data);
  electron.ipcRenderer.send('screenshot', event.data);
});

electron.ipcRenderer.on('screenshot', (_event, data) => {
  console.log('main to renderer', data);
  window.postMessage(data);
})
