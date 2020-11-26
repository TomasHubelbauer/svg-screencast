const electron = require('electron');
const fs = require('fs');

electron.app.once('ready', async () => {
  // Delete existing frames as we'll be replacing them with a new set
  for (const entry of await fs.promises.readdir('.', { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.bmp')) {
      await fs.promises.unlink(entry.name);
    }
  }

  const window = new electron.BrowserWindow({ width: 600, height: 400 });
  window.loadFile('./index.html');

  window.webContents.once('dom-ready', async () => {
    while (!window.isDestroyed()) {
      const nativeImage = await window.capturePage();
      const { width, height } = nativeImage.getSize();
      const rgba = nativeImage.getBitmap();
      if (rgba.byteLength !== width * height * 4) {
        throw new Error(`The RGBA buffer length (${rgba.byteLength}) does not match the dimensions: ${width}x${height}x4 (32 bpp).`);
      }

      // Calculate the line length - the smallest multiple of 4 that fits the line RGB
      const fit = (width * 3) / 4;
      const line = (~~fit < fit ? ~~fit + 1 : ~~fit) * 4;
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

      await fs.promises.writeFile(new Date().valueOf() + '.bmp', buffer);
    }
  });
});
