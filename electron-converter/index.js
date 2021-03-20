const electron = require('electron');

process.on('unhandledRejection', error => { throw error; });
process.on('uncaughtException', error => { throw error; });

void async function () {
  await electron.app.whenReady();

  const window = new electron.BrowserWindow({ width: 600, height: 400, webPreferences: { preload: electron.app.getAppPath() + '/preload.js' } });
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
      const buffer = Buffer.from(arrayBuffer);
      const nativeImage = electron.nativeImage.createFromBuffer(buffer);
      const { width, height } = await nativeImage.getSize();
      const crop = (/** @type {Patch} */ patch) => (patch ? nativeImage.crop(patch) : nativeImage).toPNG();
      yield { stamp, buffer, width, height, format: 'image/png', crop };
    }
  }

  // TODO: Change this module to ESM while preserving preload functionality and
  // hook up the rest
  for await (const screenshot of screenshots()) {
    console.log(screenshot.stamp, screenshot.width, screenshot.height);
  }

  // const marker = '<image class="_';
  // const stream = fs.createWriteStream('../screencast-converted.svg');
  // const _cache = {};
  // for await (const buffer of screencast(cache(screenshots, _cache))) {
  //   stream.write(buffer);
  //   if (buffer.startsWith(marker)) {
  //     console.log(buffer.slice(marker.length, buffer.indexOf('"', marker.length)), '|'.repeat(_cache.overhead));
  //   }
  // }

  // stream.close();
  // process.exit();
}()
