import fs from 'fs';
import sharp from 'sharp';
import _patch from './patch.js';

/** @typedef {{ stamp: Date; buffer: Buffer; }} Screenshot */
export default async function screencast(/** @type {string} */ path, /** @type {Screenshot[]} */ screenshots, patch = _patch) {
  const stream = fs.createWriteStream(path);

  /** @type {Date} */
  let stamp;
  let frame = 0;

  /** @type {Buffer} */
  let _buffer;

  /** @type {{ width: number; height: number; format: string; }} */
  let _metadata;

  for await (const screenshot of screenshots) {
    const data = sharp(screenshot.buffer);
    const metadata = await data.metadata();

    // Write header and poster on initial screenshot
    if (stamp === undefined) {
      stamp = screenshot.stamp;

      const { width, height, format } = metadata;
      stream.write(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`);
      stream.write(`<image width="${width}" height="${height}" href="data:image/${format};base64,${screenshot.buffer.toString('base64')}"/>\n`);
      stream.write(`<style>\nimage[class] { visibility: hidden; }\n@keyframes _ { to { visibility: visible; } }\n</style>\n`);

      _buffer = await data.raw().toBuffer();
      _metadata = metadata;
      continue;
    }

    // Ensure size remains constant among the screenshots
    if (metadata.width !== _metadata.width || metadata.height !== _metadata.height) {
      throw new Error(`Screenshot size ${metadata.width}×${metadata.height} differs from baseline ${_metadata.width}×${_metadata.height}.`);
    }

    // Ensure stamp remains chronological among the screenshots
    if (screenshot.stamp <= stamp) {
      throw new Error(`Screenshot stamp ${screenshot.stamp} is not chronological with respect to baseline ${stamp}.`);
    }

    const buffer = await data.raw().toBuffer();

    // TODO: Make the `patch` implementation configurable and develop alternatives.
    // Keep merging overlapping, touching and maybe even nearby regions and keeping
    // the merged region if the resulting SVG string of the merged region is shorter
    // than the combined SVG string of the two individual regions. Signal insertion
    // of an entire frame where patching the damage would result in a longer SVG
    // string than placing the frame in as a whole
    const patches = patch(metadata.width, metadata.height, _buffer, buffer);
    if (patches.length > 0) {
      stream.write(`<style>._${frame} { animation: _ 0ms ${screenshot.stamp - stamp}ms forwards; }</style>\n`);

      for (const patch of patches) {
        const buffer = await data.extract(patch).png().toBuffer();
        stream.write(`<image class="_${frame}" x="${patch.left}" y="${patch.top}" width="${patch.width}" height="${patch.height}" href="data:image/${metadata.format};base64,${buffer.toString('base64')}"/>\n`);
      }
    }

    _buffer = buffer;
    frame++;
  }

  stream.write('</svg>\n');
  stream.close();
}
