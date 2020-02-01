const { app, BrowserWindow } = require('electron');
const Screencast = require('./src/Screencast');
const svgFluff = require('./src/svgFluff');
const htmlFluff = require('./src/htmlFluff');
//const fs = require('fs-extra');
//const rgbaToBmp = require('./test/rgbaToBmp');

// Crash on an unhandled promise rejection error
process.once('unhandledRejection', error => { throw error; });

app.once('ready', () => {
  const window = new BrowserWindow({ width: 600, height: 400 });
  window.loadFile('demo/index.html');

  /** @type {Fluff} */
  let fluff;
  switch (process.argv[2]) {
    case 'svg': {
      fluff = svgFluff;
      break;
    }
    case 'html': {
      fluff = htmlFluff;
      break;
    }
    default: {
      fluff = svgFluff;
      break;
    }
  }

  const screencast = new Screencast('demo/screencast', fluff);
  window.webContents.once('dom-ready', async () => {
    const limit = undefined; // Set frame limit for debugging
    //let lastScreenshot;
    while (!window.isDestroyed()) {
      const screenshot = await window.capturePage();
      const { frame, regions } = await screencast.cast(screenshot);
      if (regions.length > 0) {
        console.log('At frame', frame, 'patched', regions.length, 'regions');
        // if (regions.length >= 10) {
        //   await fs.ensureDir('test/broken@' + frame);
        //   const { width: width1, height: height1 } = lastScreenshot.getSize();
        //   const buffer1 = lastScreenshot.getBitmap();
        //   await fs.writeFile(`test/broken@${frame}/1.bmp`, rgbaToBmp(width1, height1, buffer1));
        //   const { width: width2, height: height2 } = screenshot.getSize();
        //   const buffer2 = screenshot.getBitmap();
        //   await fs.writeFile(`test/broken@${frame}/2.bmp`, rgbaToBmp(width2, height2, buffer2));
        //   await fs.writeJson(`test/broken@${frame}/expected.json`, regions, { spaces: 2 });
        // }
      }

      if (frame === limit) {
        window.close();
        break;
      }

      lastScreenshot = screenshot;
    }

    await screencast.seal();
  });
});
