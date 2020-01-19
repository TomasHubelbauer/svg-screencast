const { app, BrowserWindow } = require('electron');

// Crash on an error
process.once('unhandledRejection', error => { throw error; });

app.once('ready', () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  window.loadFile('index.html');
  window.webContents.once('dom-ready', async () => {
    const screencast = new SvgScreencast(await window.capturePage());
    while (!window.isDestroyed()) {
      const bounds = screencast.cast(await window.capturePage());
      if (bounds) {
        window.webContents.executeJavaScript(`highlight(${JSON.stringify(bounds)});`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
});

class SvgScreencast {
  constructor(/** @type {Electron.NativeImage} */ screenshot) {
    this.screenshot = screenshot;
  }

  cast(/** @type {Electron.NativeImage} */ screenshot) {
    const { width, height } = this.screenshot.getSize();
    const screenshotSize = screenshot.getSize();
    if (screenshotSize.width !== width || screenshotSize.height !== height) {
      throw new Error(`Screenshot sizes begun to differ: ${width}×${height} vs ${screenshotSize.width}×${screenshotSize.height}`);
    }

    const bitmap = this.screenshot.getBitmap();
    const screenshotBitmap = screenshot.getBitmap();
    let minX;
    let minY;
    let maxX;
    let maxY;
    const changes = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const rgba = bitmap.slice(y * width + x * 4, y * width + x * 4 + 4);
        const screenshotRgba = screenshotBitmap.slice(y * width + x * 4, y * width + x * 4 + 4);
        if (rgba.some((component, index) => screenshotRgba[index] !== component)) {
          changes.push([x, y]);

          if (minX === undefined || x < minX) {
            minX = x;
          }

          if (minY === undefined || y < minY) {
            minY = y;
          }

          if (maxX === undefined || x > maxX) {
            maxX = x;
          }

          if (maxY === undefined || y > maxY) {
            maxY = y;
          }
        }
      }
    }

    //this.screenshot = screenshot;
    if (minX === undefined && minY === undefined && maxX === undefined && maxY === undefined) {
      //return;
    }

    return { changes, minX, minY, maxX, maxY };
  }
}
