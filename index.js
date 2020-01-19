const { app, BrowserWindow, screen } = require('electron');
const fs = require('fs-extra');

// Crash on an unhandled promise rejection error
process.once('unhandledRejection', error => { throw error; });

app.once('ready', () => {
  const window = new BrowserWindow({ width: 800, height: 600 });
  window.loadFile('index.html');

  const screencast = new SvgScreencast('screencast.svg');
  window.webContents.once('dom-ready', async () => {
    while (!window.isDestroyed()) {
      const frame = await screencast.cast(await window.capturePage());
      if (frame) {
        console.log('Written patch ', frame);
      }
    }

    await screencast.seal();
  });
});

class SvgScreencast {
  constructor(name) {
    this.name = name;
  }

  async cast(/** @type {Electron.NativeImage} */ screenshot) {
    // Handle the initial frame specially - store the entire frame and the SVG prolog
    if (!this.screenshot) {
      this.screenshot = screenshot;
      this.stamp = new Date();
      this.frame = 0;

      const { width, height } = this.screenshot.getSize();
      await fs.writeFile(this.name, [
        '<!-- SVG Screencast -->',
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
        `<image href="${this.screenshot.toDataURL()}" />`,
        '<style>',
        '  image[id] { visibility: hidden; }',
        '  @keyframes cast { to { visibility: visible; } }',
        '</style>',
      ].join('\n'));

      return;
    }

    const { width, height } = this.screenshot.getSize();
    const screenshotSize = screenshot.getSize();
    if (screenshotSize.width !== width || screenshotSize.height !== height) {
      throw new Error(`Screenshot sizes differ: ${width}×${height} vs ${screenshotSize.width}×${screenshotSize.height}`);
    }

    const bitmap = this.screenshot.getBitmap();
    const screenshotBitmap = screenshot.getBitmap();
    let minX;
    let minY;
    let maxX;
    let maxY;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const index = y * width * 4 + x * 4;
        const rgba = bitmap.slice(index, index + 3);
        const screenshotRgba = screenshotBitmap.slice(index, index + 3);
        if (rgba.some((component, index) => screenshotRgba[index] !== component)) {
          if (minX === undefined || x < minX) {
            minX = x;
          }

          if (minY === undefined || y < minY) {
            minY = y;
          }

          if (maxX === undefined || x > maxX) {
            maxX = x;
          }

          if (maxY === undefined || y > maxY) {
            maxY = y;
          }
        }
      }
    }

    // Dispose the existing screenshot just in case (hopefully it gets GC'd okay)
    delete this.screenshot;
    this.screenshot = screenshot;
    if (minX === undefined && minY === undefined && maxX === undefined && maxY === undefined) {
      return;
    }

    // Add 1 to both the width and height because a 1x1 pixel change will have the same mix and max
    const crop = this.screenshot.crop({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
    this.frame++;
    const stamp = ~~(new Date() - this.stamp);
    await fs.appendFile(this.name, [
      `<style>#_${this.frame} { animation: cast 0ms ${stamp}ms forwards; }</style>`,
      `<image id="_${this.frame}" x="${minX}" y="${minY}" href="${crop.toDataURL()}" />`,
    ].join('\n'));

    return this.frame;
  }

  async seal() {
    await fs.appendFile(this.name, '\n</svg>');
  }
}
