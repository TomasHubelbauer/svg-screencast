import fs from 'fs';
import worker_threads from 'worker_threads';

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

  const marker = '<image class="_';
  const worker = new worker_threads.Worker('../screencast.js', { type: 'module' });
  const stream = fs.createWriteStream('../screencast-worker.svg');
  const _cache = {};
  worker.addListener('message', buffer => {
    // Handle crop request
    if (buffer?.crop === true) {
      const nativeImage = electron.nativeImage.createFromBuffer(buffer.buffer, { width: buffer.width, height: buffer.height });
      const result = (buffer.patch ? nativeImage.crop(buffer.patch) : nativeImage).toPNG();
      worker.postMessage({ crop: true, id: buffer.id, buffer: result });
      return;
    }

    if (buffer === null) {
      stream.close();
      worker.terminate();
      process.exit();
    }
    else {
      stream.write(buffer);
      if (buffer.startsWith(marker)) {
        console.log(buffer.slice(marker.length, buffer.indexOf('"', marker.length)), '|'.repeat(_cache.overhead));
      }
    }
  });

  while (!done) {
    const nativeImage = await window.capturePage();
    const stamp = new Date();
    const buffer = await nativeImage.getBitmap();
    const { width, height } = await nativeImage.getSize();
    worker.postMessage({ stamp, buffer, width, height, format: 'image/png' });
  }

  worker.postMessage(null);
}
