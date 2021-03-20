import fs from 'fs';
import screencast from '../screencast.js';

export default async function (electron) {
  await electron.app.whenReady();

  const window = new electron.BrowserWindow({ width: 600, height: 400, show: false, webPreferences: { preload: electron.app.getAppPath() + '/preload/preload.js' } });
  window.loadFile('index.html');
  await new Promise(resolve => window.webContents.once('dom-ready', resolve));

  // Delay the closure of the window to allow the processing to finish first
  let done = false;
  window.once('close', event => {
    done = true;
    event.preventDefault();
  });

  let load = defer();
  let frames;
  let frame = 0;
  let screenshot;
  electron.ipcMain.on('screenshot', (_event, arg) => {
    switch (arg?.type) {
      case 'load': {
        frames = arg.frames;
        load.resolve();
        break;
      }
      case 'end': {
        done = true;
        break;
      }
      case 'frame': {
        screenshot.resolve(arg);
        break;
      }
    }
  });

  async function* screenshots() {
    while (!done) {
      if (frame === frames) {
        break;
      }

      screenshot = defer();
      window.webContents.send('screenshot', { type: 'screenshot', frame });
      const { arrayBuffer, stamp, frame: _frame } = await screenshot.promise;
      frame++;
      console.log(`${frame}/${frames}: ${~~((frame / frames) * 100)} %`);
      const nativeImage = electron.nativeImage.createFromBuffer(Buffer.from(arrayBuffer));
      const buffer = nativeImage.toBitmap();
      const { width, height } = await nativeImage.getSize();
      const crop = (/** @type {Patch} */ patch) => (patch ? nativeImage.crop(patch) : nativeImage).toPNG();
      yield { stamp, buffer, width, height, format: 'image/png', crop };
    }
  }

  await load.promise;

  const stream = fs.createWriteStream('sample.svg');
  for await (const buffer of screencast(screenshots)) {
    stream.write(buffer);
  }

  stream.close();
  process.exit();
}

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { resolve, reject, promise };
}
