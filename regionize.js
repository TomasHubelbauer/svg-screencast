import './types.js';

export default function* regionize(/** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ buffer1, /** @type {Buffer} */ buffer2) {
  const length = width * height * 4;
  if (buffer1.byteLength !== length || buffer2.byteLength !== length) {
    throw new Error(`The buffers were expected to be of ${length} bytes but were ${buffer1.byteLength} and ${buffer2.byteLength} respectively.`);
  }

  /** @type {Region[]} */
  const regions = [];

  // Walk the pixels left to right horizontally
  for (let x = 0; x < width; x++) {
    // Walk the pixels top to bottom vertically
    for (let y = 0; y < height; y++) {
      const index = y * width * 4 + x * 4;

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
        if (x >= region.x && x <= region.x + region.width && region.y + region.height === y) {
          region.height++;
          match = region;
        }

        if (y >= region.y && y <= region.y + region.height) {
          // Extend the region horizontally in case the changed pixel touches its right side
          if (region.x + region.width === x) {
            region.width++;
            match = region;
          }
          // Mark the region in case the changed pixel is in it
          else if (x >= region.x && x <= region.x + region.width) {
            match = region;
          }
        }

        // Stretch the region in case the changed pixel is at its top-right corner
        if (region.x + region.width === x && region.y - 1 === y) {
          region.width++;
          region.height++;
          region.y--;
          match = region;
        }
      }

      // Create a new region since no existing region matched the changed pixel
      if (match === undefined) {
        regions.push({ x, y, width: 1, height: 1 });
      }
    }
  }

  // Yield the remaining regions (in case they were touching the right or bottom borders)
  yield* regions;
}
