const { app, BrowserWindow } = require('electron');

// Crash on an error
process.once('unhandledRejection', error => { throw error; });

app.once('ready', () => {
  const recordWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: 100,
    y: 100,
    webPreferences: {
      nodeIntegration: true
    }
  });

  recordWindow.loadFile('record.html');

  const previewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: 108,
    y: 151,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  previewWindow.loadFile('preview.html');
  previewWindow.setIgnoreMouseEvents(true);

  recordWindow.webContents.once('dom-ready', async () => {
    const screencast = new SvgScreencast(await recordWindow.capturePage());
    while (!recordWindow.isDestroyed()) {
      const bounds = screencast.cast(await recordWindow.capturePage());
      if (bounds) {
        // Check this after the first `await` to avoid race condition
        if (previewWindow.isDestroyed()) {
          break;
        }

        previewWindow.webContents.executeJavaScript(`highlight(${JSON.stringify(bounds)});`);
      }
    }
  });

  // Link closing of the two windows together
  recordWindow.once('close', () => previewWindow.close());
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
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const index = y * width * 4 + x * 4;
        const rgba = bitmap.slice(index, index + 3);
        const screenshotRgba = screenshotBitmap.slice(index, index + 3);
        if (rgba.some((component, index) => screenshotRgba[index] !== component)) {
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

    this.screenshot = screenshot;
    if (minX === undefined && minY === undefined && maxX === undefined && maxY === undefined) {
      return;
    }

    return { minX, minY, maxX, maxY };
  }
}
