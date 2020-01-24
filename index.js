const { app, BrowserWindow, screen } = require('electron');
const fs = require('fs-extra');

// Crash on an unhandled promise rejection error
process.once('unhandledRejection', error => { throw error; });

app.once('ready', () => {
  const window = new BrowserWindow({ width: 600, height: 400 });
  window.loadFile('index.html');

  const screencast = new SvgScreencast('screencast.svg');
  window.webContents.once('dom-ready', async () => {
    // Limit to two screenshots (background and patch) for now
    let frame = 0;
    const limit = undefined; // Set for debugging
    while (!window.isDestroyed() && (!limit || frame < limit)) {
      const regions = await screencast.cast(await window.capturePage());
      if (regions && regions.length > 0) {
        console.log('At frame', frame, 'patched', regions);
      }

      frame++;
    }

    // Close the window in case the loop ended at the frame limit and not by the user closing it
    if (!window.isDestroyed()) {
      window.close();
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
        `<image width="${width}" height="${height}" href="${this.screenshot.toDataURL()}" />`,
        '<style>',
        '  image[id] { visibility: hidden; }',
        '  @keyframes cast { to { visibility: visible; } }',
        '</style>',
      ].join('\n'));

      await fs.writeFile(this.name + '.html', [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="utf-8" />',
        `<title>${this.name}</title>`,
        '<style>',
        'img { box-shadow: 0 0 2px 2px rgba(0, 0, 0, .25); }',
        '</style>',
        '<script>',
        `window.addEventListener('load', () => {`,
        `document.querySelectorAll('img').forEach(img => {`,
        `img.addEventListener('mousemove', event => document.title = event.offsetX + ' ' + event.offsetY)`,
        '})',
        '})',
        '</script>',
        '</head>',
        '<body>',
        `<h1>${this.name}</h1>`,
        `<p>Start with a ${width}×${height} screenshot:</p>`,
        `<img width="${width}" height="${height}" src="${this.screenshot.toDataURL()}" />`
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

    const threshold = 5;
    const regions = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const index = y * width * 4 + x * 4;
        const rgba = bitmap.slice(index, index + 3);
        const screenshotRgba = screenshotBitmap.slice(index, index + 3);

        // Detect if the given pixel has changed since the last screenshot
        if (rgba.some((component, index) => screenshotRgba[index] !== component)) {
          let touch = false;

          // Determine if any of the existing regions touches the changed pixel
          for (const region of regions) {
            // Leave the region as-is if it already contains the changed pixel
            if (x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height) {
              touch = true;
              break;
            }

            // Inflate the region by the modulated threshold value to see if it could contain the changed pixel
            const regionX = Math.max(region.x - threshold, 0);
            const regionY = Math.max(region.y - threshold, 0);
            const regionWidth = Math.min(region.width + threshold * 2, width - regionX);
            const regionHeight = Math.min(region.height + threshold * 2, height - regionY);

            // Commit the inflation to the region if it caught the changed pixel
            if (x >= regionX && x <= regionX + regionWidth && y >= regionY && y <= regionY + regionHeight) {
              region.x = regionX;
              region.y = regionY;
              region.width = regionWidth;
              region.height = regionHeight;
              touch = true;
              break;
            }
          }

          // Create a new region in case the changed pixel didn't touch any existing region
          if (!touch) {
            // Confine the regions to a perfect grid by quantizing the x and y
            regions.push({ x: ~~(x / threshold) * threshold, y: ~~(y / threshold) * threshold, width: threshold * 2, height: threshold * 2 });
          }
        }
      }
    }

    // Dispose the existing screenshot just in case (hopefully it gets GC'd okay)
    delete this.screenshot;
    this.screenshot = screenshot;

    if (regions.length > 0) {
      const stamp = ~~(new Date() - this.stamp);
      await fs.appendFile(this.name + '.html', [
        `<p>At ${stamp} ms, patch ${regions.length} background regions with the new screenshot:</p>`,
        '<div style="position: relative;">',
      ].join('\n'));
      for (const region of regions) {
        const { x, y, width, height } = region;
        const crop = this.screenshot.crop({ x, y, width, height });
        this.frame++;

        await fs.appendFile(this.name, [
          `<style>#_${this.frame} { animation: cast 0ms ${stamp}ms forwards; }</style>`,
          `<image id="_${this.frame}" x="${x}" y="${y}" width="${width}" height="${height}" href="${crop.toDataURL()}" />`,
        ].join('\n'));

        await fs.appendFile(this.name + '.html', [
          `<img width="${width}" height="${height}" style="position: absolute; left: ${x}px; top: ${y}px;" src="${crop.toDataURL()}" />`,
        ].join('\n'));
      }

      await fs.appendFile(this.name + '.html', [
        `<img src="${this.screenshot.toDataURL()}" />`,
        '</div>',
      ].join('\n'));
    }

    return regions;
  }

  async seal() {
    await fs.appendFile(this.name, '\n</svg>');
    await fs.appendFile(this.name + '.html', `\n<p>Done!</p>\n<img src="${this.name}" />\n</body>\n</html>\n`);
  }
}
