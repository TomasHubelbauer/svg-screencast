import fs from 'fs';
import path from 'path';
import screencast from './screencast.js';
import sharp from 'sharp';

process.addListener('uncaughtException', error => { throw error; });

void async function () {
  const marker = '<image class="_';
  const stream = fs.createWriteStream('docs/demo.svg');
  for await (const buffer of screencast(screenshots)) {
    stream.write(buffer);
    if (buffer.startsWith(marker)) {
      console.log(buffer.slice(marker.length, buffer.indexOf('"', marker.length)));
    }
  }

  stream.close();
}()

/** @typedef {{ left: number; top: number; width: number height: number; }} Patch */

async function* screenshots() {
  for (const entry of await fs.promises.readdir('demo', { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.png')) {
      continue;
    }

    const stamp = Number(entry.name.slice(0, -'.png'.length));
    const _sharp = sharp(await fs.promises.readFile(path.join('demo', entry.name)));
    const buffer = await _sharp.raw().toBuffer();
    const { width, height, format } = await _sharp.metadata();
    const crop = (/** @type {Patch} */ patch) => (patch ? _sharp.extract(patch) : _sharp).png().toBuffer();
    yield { stamp, buffer, width, height, format, crop };
  }
}
