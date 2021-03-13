import fs from 'fs';
import screencast from '../screencast.js';

/** @typedef {{ left: number; top: number; width: number height: number; }} Patch */

export default async function (electron) {
  await electron.app.whenReady();

  const window = new electron.BrowserWindow({ width: 600, height: 400 });
  window.loadFile('index.html');
  await new Promise(resolve => window.webContents.once('dom-ready', resolve));

  async function* screenshots() {
    while (!window.isDestroyed()) {
      const nativeImage = await window.capturePage();
      if (nativeImage.isEmpty() && window.isDestroyed()) {
        break;
      }

      const stamp = new Date();
      const buffer = await nativeImage.getBitmap();
      const { width, height } = await nativeImage.getSize();
      const crop = (/** @type {Patch} */ patch) => (patch ? nativeImage.crop(patch) : nativeImage).toPNG();
      yield { stamp, buffer, width, height, format: 'image/png', crop };
    }
  }

  const marker = '<image class="_';
  const stream = fs.createWriteStream('../screencast.svg');
  for await (const buffer of screencast(screenshots)) {
    stream.write(buffer);
    if (buffer.startsWith(marker)) {
      console.log(buffer.slice(marker.length, buffer.indexOf('"', marker.length)));
    }
  }

  stream.close();
}
