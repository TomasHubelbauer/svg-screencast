import fs from 'fs';
import screencast from '../screencast.js';

export default async function (electron) {
  await electron.app.whenReady();

  const window = new electron.BrowserWindow({ width: 600, height: 400, webPreferences: { preload: electron.app.getAppPath() + '/preload/preload.js' } });
  window.loadFile('index.html');
  await new Promise(resolve => window.webContents.once('dom-ready', resolve));

  // Delay the closure of the window to allow the processing to finish first
  let done = false;
  window.once('close', event => {
    done = true;
    event.preventDefault();
  });

  // TODO: Replace with a buffer cache
  const screenshotCache = [];
  electron.ipcMain.on('screenshot', (_event, arg) => {
    if (arg === null) {
      done = true;
      return;
    }

    screenshotCache.push({ arrayBuffer: arg, stamp: new Date() });
  });

  async function* screenshots() {
    while (!done) {
      // TODO: Replace with a buffer cache
      if (screenshotCache.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const { arrayBuffer, stamp } = screenshotCache.shift();
      const nativeImage = electron.nativeImage.createFromBuffer(Buffer.from(arrayBuffer));
      const buffer = nativeImage.toBitmap();
      const { width, height } = await nativeImage.getSize();
      const crop = (/** @type {Patch} */ patch) => (patch ? nativeImage.crop(patch) : nativeImage).toPNG();
      yield { stamp, buffer, width, height, format: 'image/png', crop };
    }
  }

  const marker = '<image class="_';
  const stream = fs.createWriteStream('../screencast-converted.svg');
  for await (const buffer of screencast(screenshots)) {
    stream.write(buffer);
    if (buffer.startsWith(marker)) {
      console.log(buffer.slice(marker.length, buffer.indexOf('"', marker.length)), '|'.repeat(screenshotCache.length));
    }
  }

  stream.close();
  process.exit();
}
