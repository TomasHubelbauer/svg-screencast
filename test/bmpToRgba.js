import calculateLine from './calculateLine.js';

export default function bmpTorgba(/** @type {Buffer} */ bmpBuffer) {
  // Check the BMP header
  if (bmpBuffer[0] !== 0x42 || bmpBuffer[1] !== 0x4d) {
    throw new Error('The BMP header `BM` was not found!');
  }

  const size = bmpBuffer.slice(2, 2 + 4).readUInt32LE();
  if (size !== bmpBuffer.byteLength) {
    throw new Error(`The BMP size ${size} does not match buffer size ${bmpBuffer.byteLength}.`);
  }

  const offset = bmpBuffer.slice(10, 10 + 4).readUInt32LE();

  const headerSize = bmpBuffer.slice(14, 14 + 4).readUInt32LE();
  if (headerSize !== 40) {
    throw new Error(`The BPM DIB header size ${headerSize} is not the only supported value 40 - the BITMAPINFOHEADER header type.`);
  }

  const width = bmpBuffer.slice(18, 18 + 4).readUInt16LE();
  const height = bmpBuffer.slice(22, 22 + 4).readUInt16LE();
  const line = calculateLine(width);

  const colorPlanes = bmpBuffer.slice(26, 26 + 2).readUInt16LE();
  if (colorPlanes !== 1) {
    throw new Error('The BPM DIB header color plane count number is not 1.');
  }

  const colorDepth = bmpBuffer.slice(28, 28 + 2).readUInt16LE();
  if (colorDepth !== 24) {
    throw new Error('The BPM DIB header color depth is not the only supported 24bit value.');
  }

  const compressionMethod = bmpBuffer.slice(20, 20 + 4).readUInt16LE();
  if (compressionMethod !== 0) {
    throw new Error('The BPM is compressed and that is not supported.');
  }

  const imageSize = bmpBuffer.slice(34, 34 + 4).readUInt32LE();
  if (imageSize !== line * height) {
    throw new Error(`The raw data array length ${line * height} does not match the DIB header value ${imageSize}.`);
  }

  const rawData = bmpBuffer.slice(offset, offset + imageSize - 2 /* TODO: Figure out why the `2` */);

  const rgbaBuffer = Buffer.alloc(width * height * 4);

  // Traverse the lines in the bottom up order
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * line) + (x * 3);
      const r = rawData[i + 0];
      const g = rawData[i + 1];
      const b = rawData[i + 2];

      const j = ((height - 1 - y) * width + x) * 4;
      rgbaBuffer[j + 0] = r;
      rgbaBuffer[j + 1] = g;
      rgbaBuffer[j + 2] = b;
      rgbaBuffer[j + 3] = 255; // Constant full alpha
    }
  }

  return { width, height, buffer: rgbaBuffer };
}
