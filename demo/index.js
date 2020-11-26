const electron = require('electron');
const fs = require('fs');

electron.app.once('ready', async () => {
  // Delete existing screenshots as we'll be replacing them with a new ones
  for (const entry of await fs.promises.readdir('.', { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.png')) {
      await fs.promises.unlink(entry.name);
    }
  }

  const window = new electron.BrowserWindow({ width: 600, height: 400 });
  window.loadFile('./index.html');

  window.webContents.once('dom-ready', async () => {
    while (!window.isDestroyed()) {
      const nativeImage = await window.capturePage();
      await fs.promises.writeFile(new Date().valueOf() + '.png', nativeImage.toPNG());
    }
  });
});
