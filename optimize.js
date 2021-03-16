/** @typedef {(x: number, y: number, width: number, height: number) => Promise<Buffer>} Crop */
/** @typedef {{ x: number, y: number, width: number, height: number }} Patch */

// Optimize the patches by finding the combination of merges which produces the
// shortest total SVG string length
// TODO: Account for the whole SVG string length not just the WIP data URL part
// TODO: Return a patch for a whole new frame if its size is shorter than patch
export default async function optimize(/** @type {Patch[]} */ patches, /** @type {Crop} */ crop) {
  // Ignore frames between which no changed had occured
  if (patches.length === 0) {
    return patches;
  }

  if (patches.length === 1) {
    // TODO: Check here as well to see if a whole new frame is smaller than patch
    return patches;
  }

  let total = 0;
  const urls = new Map();
  for (const patch of patches) {
    const url = (await crop(patch)).toString('base64');
    urls.set(patch, url);
    total += url.length;
  }

  const combinations = combine(patches);
  for (const combination of combinations) {
    if (combination.merged.length === 1) {
      combination.patch = combination.merged[0];
      combination.url = urls.get(combination.patch);
      combination.length = combination.url.length;
    }
    else {
      const left = Math.min(...combination.merged.map(patch => patch.x));
      const top = Math.min(...combination.merged.map(patch => patch.y));
      const right = Math.max(...combination.merged.map(patch => patch.x + patch.width));
      const bottom = Math.max(...combination.merged.map(patch => patch.y + patch.height));
      combination.patch = { x: left, y: top, width: right - left, height: bottom - top };
      const buffer = await crop(combination.patch);
      combination.url = buffer.toString('base64');
      combination.length = combination.url.length;
    }

    if (combination.rest.length > 0) {
      combination.length += combination.rest.reduce((length, patch) => length + urls.get(patch).length, 0);
    }
  }

  const length = Math.min(...combinations.map(combo => combo.length));

  // Return early so this find doesn't get logged as an optimization - same size
  if (length === total) {
    return patches;
  }

  const combination = combinations.find(combination => combination.length === length);

  console.log(`${patches.length} merged to ${combination.rest.length + 1} (lengths: ${total} > ${combination.length} [${~~((combination.length / total) * 100)}])`);
  return [combination.patch, ...combination.rest];
}

function combine(/** @type {Array} */ array, index = 0, current = [], accumulator = []) {
  if (array.slice(index).length === 0) {
    if (current.length === 0) {
      return;
    }

    accumulator.push({ merged: [...current], rest: array.filter(item => !current.includes(item)) });
    return accumulator;
  }

  combine(array, index + 1, [...current, array[index]], accumulator);
  combine(array, index + 1, [...current], accumulator);
  return accumulator;
}
