module.exports = function bmpTorgba(/** @type {Buffer} */ bmpBuffer) {
  // Check the BMP header
  if (bmpBuffer[0] !== 0x42 || bmpBuffer[1] !== 0x4d) {
    throw new Error('The BMP header was not found!');
  }

  const size = bmpBuffer.slice(2, 2 + 4).readUInt32LE();
  if (size !== bmpBuffer.byteLength) {
    throw new Error('The BMP size does not match buffer size.');
  }

  const offset = bmpBuffer.slice(10, 10 + 4).readUInt32LE();

  const headerSize = bmpBuffer.slice(14, 14 + 4).readUInt32LE();
  if (headerSize !== 40) {
    throw new Error('The BPM DIB header is not the only supported BITMAPINFOHEADER type.');
  }

  const width = bmpBuffer.slice(18, 18 + 4).readUInt16LE();
  const height = bmpBuffer.slice(22, 22 + 4).readUInt16LE();

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
  if (imageSize !== width * height * 3 /* 24 bits = 3 bytes */ + 2 /* TODO: Figure out why the `2` */) {
    throw new Error('The raw data array length does not match the DIB header value.');
  }

  const rawData = bmpBuffer.slice(offset, imageSize - 2 /* TODO: Figure out why the `2` */);

  const rgbaBuffer = Buffer.alloc(width * height * 4);
  let index = 0;
  do {
    const r = rawData[index * 3 + 0];
    const g = rawData[index * 3 + 1];
    const b = rawData[index * 3 + 2];

    // Convert down-up index to up-down index
    const x = index % width;
    const y = height - 1 - ~~(index / width);
    const rgbaIndex = y * width + x * 4 /* 32bit RGBA */;

    rgbaBuffer[rgbaIndex + 0] = r;
    rgbaBuffer[rgbaIndex + 1] = g;
    rgbaBuffer[rgbaIndex + 2] = b;
    rgbaBuffer[rgbaIndex + 3] = 255; // Constant full alpha

    index++;
  } while (index < width * height);

  return { width, height, buffer: rgbaBuffer };
}
