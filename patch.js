export default function patch(/** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ buffer1, /** @type {Buffer} */ buffer2) {
  if (buffer1.length !== buffer2.length) {
    throw new Error(`Buffers are not the same length: ${buffer1.length} versus ${buffer2.length}!`);
  }

  let hit = false;
  let left;
  let right;
  let top;
  let bottom;

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

      // Mark patch-finding a success to know we shouldn't return an empty array
      hit = true;

      if (left === undefined || left > x) {
        left = x;
      }

      if (right === undefined || right < x) {
        right = x;
      }

      if (top === undefined || top > y) {
        top = y;
      }

      if (bottom === undefined || bottom < y) {
        bottom = y;
      }
    }
  }

  if (!hit) {
    return [];
  }

  return [{ left, top, width: right - left + 1, height: bottom - top + 1 }];
}
