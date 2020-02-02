const fs = require('fs-extra');
const regionize = require('./regionize');
const optimize = require('./optimize');

/** @type {Fluff} */
const svgFluff = require('./svgFluff');

module.exports = class Screencast {
  constructor(/** @type {string} */ name, /** @type {Fluff} */ fluff = svgFluff) {
    this.name = name;
    this.fluff = fluff;
  }

  async cast(/** @type {Electron.NativeImage} */ screenshot) {
    // Handle the initial frame specially - store the entire frame and the prolog
    if (!this.screenshot) {
      this.screenshot = screenshot;
      this.stamp = new Date();
      this.frame = 0;
      const { width, height } = this.screenshot.getSize();
      const dataUrl = this.screenshot.toDataURL();
      await fs.writeFile(this.name + this.fluff.extension, this.fluff.prolog(this.name, width, height, dataUrl));
      return { frame: this.frame, regions: [] };
    }

    const { width, height } = this.screenshot.getSize();
    const screenshotSize = screenshot.getSize();
    if (screenshotSize.width !== width || screenshotSize.height !== height) {
      throw new Error(`Screenshot sizes differ: ${width}×${height} vs ${screenshotSize.width}×${screenshotSize.height}`);
    }

    const regions = optimize(width, height, ...regionize(width, height, this.screenshot.getBitmap(), screenshot.getBitmap()));

    // Dispose the existing screenshot just in case (hopefully it gets GC'd okay)
    delete this.screenshot;
    this.screenshot = screenshot;

    const stamp = ~~(new Date() - this.stamp);

    /** @type {Patch[]} */
    const patches = regions.map(region => ({ region, dataUrl: this.screenshot.crop(region).toDataURL() }));
    await fs.appendFile(this.name + this.fluff.extension, this.fluff.frame(this.frame, stamp, patches));

    this.frame++;
    return { frame: this.frame, regions };
  }

  async seal() {
    await fs.appendFile(this.name + this.fluff.extension, this.fluff.epilog());
  }
}
