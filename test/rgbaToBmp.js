module.exports = function rgbaToBmp(/** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ rgba) {
  if (rgba.byteLength !== width * height * 4) {
    throw new Error(`The RGBA buffer length (${rgba.byteLength}) does not match the dimensions: ${width}x${height}x4 (32 bpp).`);
  }

  const line = (~~((width * 3) / 4) + 1) * 4; // Line length (a multiple of 4 bytes)
  const buffer = Buffer.alloc(14 + 40 + line * height + 2);

  // Write the 14 byte BMP header
  buffer.write('BM', 'ascii');
  // TODO: Figure out why the extra 2 zeroes at the end
  buffer.writeUInt32LE(14 + 40 + line * height + 2, 2); // File size
  buffer.writeUInt16LE(0, 6); // Reserved
  buffer.writeUInt16LE(0, 8); // Reserved
  buffer.writeUInt32LE(14 + 40, 10); // Data offset

  // Write the 40 byte DIB header
  buffer.writeUInt32LE(40, 14); // BITMAPINFOHEADER value
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26); // Color planes
  buffer.writeUInt16LE(24, 28); // BPP (RGB as we're dropping alpha)
  buffer.writeUInt32LE(0, 30); // No compression
  buffer.writeUInt32LE(line * height, 34); // Raw data size
  buffer.writeInt32LE(2834, 38); // Pixels per meter horizontal
  buffer.writeInt32LE(2834, 42); // Pixels per meter vertical
  buffer.writeUInt32LE(0, 46); // No colors in palette
  buffer.writeUInt32LE(0, 50); // All colors are important

  const offset = 14 + 40;

  // Traverse the lines in the bottom up order
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = ((height - 1 - y) * width + x) * 4;
      const r = rgba[i + 0];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      const a = rgba[i + 3];

      // Warn about going from RGBA to RGB being lossy with non-full alpha
      if (a !== 255) {
        throw new Error('The RGBA has transparency which cannot be converted without data loss.');
      }

      const j = (y * line) + (x * 3);
      buffer[offset + j + 0] = r;
      buffer[offset + j + 1] = g;
      buffer[offset + j + 2] = b;
    }
  }

  return buffer;
}
