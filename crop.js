export default function crop(/** @type {number} */ width, /** @type {number} */ height, /** @type {Uint8ClampedArray} */ rgba, /** @type {{ left: number; top: number; width: number; height: number; }} */ patch) {
  const length = patch.width * patch.height * 4;
  const cropRgba = new Uint8ClampedArray(length);
  for (let line = 0; line < patch.height; line++) {
    const offset = ((patch.top + line) * width + patch.left) * 4;
    const cropOffset = line * patch.width * 4;
    cropRgba.set(rgba.slice(offset, offset + patch.width * 4), cropOffset);
  }

  return cropRgba;
}
