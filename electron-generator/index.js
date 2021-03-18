import fs from 'fs';
import screencast from '../screencast.js';
import cache from '../cache.js';

/** @typedef {{ left: number; top: number; width: number height: number; }} Patch */

export default async function (electron) {
  await electron.app.whenReady();

  const window = new electron.BrowserWindow({ width: 600, height: 400 });
  window.loadFile('index.html');
  await new Promise(resolve => window.webContents.once('dom-ready', resolve));

  // Delay the closure of the window to allow the processing to finish first
  let done = false;
  window.once('close', event => {
    done = true;
    event.preventDefault();
  });

  async function* screenshots() {
    while (!done) {
      const nativeImage = await window.capturePage();
      const stamp = new Date();
      const buffer = await nativeImage.getBitmap();
      const { width, height } = await nativeImage.getSize();
      const crop = (/** @type {Patch} */ patch) => (patch ? nativeImage.crop(patch) : nativeImage).toPNG();
      yield { stamp, buffer, width, height, format: 'image/png', crop };
    }
  }

  const marker = '<image class="_';
  const stream = fs.createWriteStream('../screencast.svg');
  const _cache = {};
  for await (const buffer of screencast(cache(screenshots, _cache))) {
    stream.write(buffer);
    if (buffer.startsWith(marker)) {
      console.log(buffer.slice(marker.length, buffer.indexOf('"', marker.length)), '|'.repeat(_cache.overhead));
    }
  }

  stream.close();
  process.exit();
}
