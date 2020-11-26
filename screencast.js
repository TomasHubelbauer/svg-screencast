import fs from 'fs';
import sharp from 'sharp';

/** @typedef {{ stamp: Date; buffer: Buffer; }} Screenshot */
export default async function screencast(/** @type {string} */ path, /** @type {Screenshot[]} */ screenshots) {
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
    const regions = regionize(metadata.width, metadata.height, _buffer, buffer);
    if (regions.length > 0) {
      stream.write(`<style>._${frame} { animation: _ 0ms ${screenshot.stamp - stamp}ms forwards; }</style>\n`);

      for (const region of regions) {
        const buffer = await data.extract(region).png().toBuffer();
        stream.write(`<image class="_${frame}" x="${region.left}" y="${region.top}" width="${region.width}" height="${region.height}" href="data:image/${metadata.format};base64,${buffer.toString('base64')}"/>\n`);
      }
    }

    _buffer = buffer;
    frame++;
  }

  stream.write('</svg>\n');
  stream.close();
}

// Note that the buffers are expected to be the same size as checked above
function regionize(/** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ buffer1, /** @type {Buffer} */ buffer2) {
  /** @type {sharp.Region[]} */
  const regions = [];

  // Walk the pixels left to right horizontally
  for (let left = 0; left < width; left++) {
    // Walk the pixels top to bottom vertically
    for (let top = 0; top < height; top++) {
      const index = top * width * 4 + left * 4;

      // Skip over the current pixel if it has not changed between the buffers
      if (
        buffer1[index + 0] === buffer2[index + 0] && // R
        buffer1[index + 1] === buffer2[index + 1] && // G
        buffer1[index + 2] === buffer2[index + 2] && // B
        buffer1[index + 3] === buffer2[index + 3] // A
      ) {
        continue;
      }

      /** @type {Region} */
      let match;

      // Extend an existing region in case it matches (touches or includes) the changed pixel
      for (const region of regions) {
        // Extend the region vertically in case the changed pixel touches its bottom side
        // Note that unlike the below case the changed pixel can never be included without
        // touching the right side first due to the left to right iteration
        if (left >= region.left && left <= region.left + region.width && region.top + region.height === top) {
          region.height++;
          match = region;
        }

        if (top >= region.top && top <= region.top + region.height) {
          // Extend the region horizontally in case the changed pixel touches its right side
          if (region.left + region.width === left) {
            region.width++;
            match = region;
          }
          // Mark the region in case the changed pixel is in it
          else if (left >= region.left && left <= region.left + region.width) {
            match = region;
          }
        }

        // Stretch the region in case the changed pixel is at its top-right corner
        if (region.left + region.width === left && region.top - 1 === top) {
          region.width++;
          region.height++;
          region.top--;
          match = region;
        }
      }

      // Create a new region since no existing region matched the changed pixel
      if (match === undefined) {
        regions.push({ left, top, width: 1, height: 1 });
      }
    }
  }

  return optimize(width, height, regions);
}

// TODO: Merge nearby regions as long as the resulting SVG is smaller than the combined SVG of the individual regions
function optimize(/** @type {number} */ width, /** @type {number} */ height, /** @type {sharp.Region[]} */ regions) {
  // TODO: Keep merging overlapping, touching and maybe even nearby regions and
  // keeping the merged region if the resulting SVG string of the merged region
  // is shorter than the combined SVG string of the two individual regions
  // TODO: Signal insertion of an entire frame where patching the damage would
  // result in a longer SVG string than placing the frame in as a whole
  return regions;
}
