import optimize from './optimize.js';
import patch from './patch.js';

/** @typedef {{ stamp: Date; buffer: Buffer; width: number; height: number; format: string; crop: Crop; }} Screenshot */

export default async function* screencast(/** @type {() => AsyncGenerator<Screenshot>} */ screenshots, optimized = false) {
  let frame = 0;

  /** @type {Date} */
  let _stamp;

  /** @type {Screenshot} */
  let _screenshot;

  // Allow passing in both a generator function and a generator object
  if (typeof screenshots === 'function') {
    screenshots = screenshots();
  }

  for await (const screenshot of screenshots) {
    const { stamp, width, height, format, buffer, crop } = screenshot;

    // Write header and poster on initial screenshot
    if (_stamp === undefined) {
      yield `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
      yield `<image width="${width}" height="${height}" href="data:image/${format};base64,${(await crop()).toString('base64')}"/>\n`;
      yield `<style>\nimage[class] { visibility: hidden; }\n@keyframes _ { to { visibility: visible; } }\n</style>\n`;

      _stamp = stamp;
      _screenshot = screenshot;
      continue;
    }

    // Ensure size remains constant among the screenshots
    if (width !== _screenshot.width || height !== _screenshot.height) {
      throw new Error(`Screenshot size ${width}×${height} differs from baseline ${_screenshot.width}×${_screenshot.height}.`);
    }

    // Ensure stamp remains chronological among the screenshots
    if (stamp <= _stamp) {
      throw new Error(`Screenshot stamp ${stamp} is not chronological with respect to baseline ${_stamp}.`);
    }

    // TODO: Implement doing this in real time as well as a post-processing step
    const patches = optimized
      ? await optimize(patch(width, height, buffer, _screenshot.buffer), crop)
      : patch(width, height, buffer, _screenshot.buffer)
      ;

    if (patches.length > 0) {
      yield `<style>._${frame} { animation: _ 0ms ${stamp - _stamp}ms forwards; }</style>\n`;

      for (const patch of patches) {
        const { x, y, width, height } = patch;
        const buffer = await crop(patch);
        yield `<image class="_${frame}" x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/${format};base64,${buffer.toString('base64')}"/>\n`;
      }

      frame++;
    }

    _screenshot = screenshot;
  }

  yield '</svg>\n';
}
