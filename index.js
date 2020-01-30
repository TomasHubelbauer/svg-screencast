const { app, BrowserWindow } = require('electron');
const Screencast = require('./src/Screencast');
const svgFluff = require('./src/svgFluff');
const htmlFluff = require('./src/htmlFluff');

// Crash on an unhandled promise rejection error
process.once('unhandledRejection', error => { throw error; });

app.once('ready', () => {
  const window = new BrowserWindow({ width: 600, height: 500 });
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
    let frame = 0;
    const limit = undefined; // Set frame limit for debugging
    while (!window.isDestroyed() && (!limit || frame < limit)) {
      const regions = await screencast.cast(await window.capturePage());
      if (regions && regions.length > 0) {
        console.log('At frame', frame, 'patched', regions.length, 'regions');
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
