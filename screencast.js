import optimize from './optimize.js';
import patch from './patch.js';

/** @typedef {{ ({ x: number; y: number; width: number; height: number; }) => Buffer; }} Crop */
/** @typedef {{ stamp: Date; buffer: Buffer; width: number; height: number; format: string; crop: Crop; }} Screenshot */

export default async function* screencast(/** @type {() => AsyncGenerator<Screenshot>} */ screenshots) {
  let frame = 0;

  /** @type {Date} */
  let _stamp;

  /** @type {Screenshot} */
  let _screenshot;

  // Allow passing in both a generator function and a generator object
  if (typeof screenshots === 'function') {
    screenshots = screenshots();
  }

  for await (const screenshot of screenshots) {
    // Use worker communication for crop because the crop screenshot function itself cannot be marshalled to the worker
    if (!screenshot.crop) {
      screenshot.crop = makeWorkerCrop(screenshot.buffer, screenshot.width, screenshot.height);
    }

    const { stamp, width, height, format, buffer, crop } = screenshot;

    // Write header and poster on initial screenshot
    if (_stamp === undefined) {
      yield `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
      yield `<image width="${width}" height="${height}" href="data:image/${format};base64,${(await crop()).toString('base64')}"/>\n`;
      yield `<style>\nimage[class] { visibility: hidden; }\n@keyframes _ { to { visibility: visible; } }\n</style>\n`;

      _stamp = stamp;
      _screenshot = screenshot;
      continue;
    }

    // Ensure size remains constant among the screenshots
    if (width !== _screenshot.width || height !== _screenshot.height) {
      throw new Error(`Screenshot size ${width}×${height} differs from baseline ${_screenshot.width}×${_screenshot.height}.`);
    }

    // Ensure stamp remains chronological among the screenshots
    if (stamp <= _stamp) {
      throw new Error(`Screenshot stamp ${stamp} is not chronological with respect to baseline ${_stamp}.`);
    }

    const patches = await optimize(patch(width, height, buffer, _screenshot.buffer), crop);
    if (patches.length > 0) {
      yield `<style>._${frame} { animation: _ 0ms ${~~(stamp - _stamp)}ms forwards; }</style>\n`;

      for (const patch of patches) {
        const { x, y, width, height } = patch;
        const buffer = await crop(patch);
        yield `<image class="_${frame}" x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/${format};base64,${buffer.toString('base64')}"/>\n`;
      }

      frame++;
    }

    _screenshot = screenshot;
  }

  yield '</svg>\n';
}

const crops = {};

function makeWorkerCrop(/** @type {Buffer} */ buffer, /** @type {number} */ width, /** @type {number} */ height) {
  return function workerCrop(/** @type {{ x: number; y: number; width: number; height: number; }} */ patch) {
    const id = Math.random();
    crops[id] = defer();
    // Issue crop request
    globalThis.worker_threads.parentPort.postMessage({ crop: true, id, buffer, width, height, patch });
    return crops[id].promise;
  }
}

void async function () {
  try {
    // Import conditionally to make runnable in the browser
    globalThis.worker_threads = await import('worker_threads');
    // Abort self-start in case `screencast` is not used in worker context
    if (worker_threads.isMainThread) {
      return;
    }

    const status = {};
    for await (const buffer of screencast(cache(status))) {
      worker_threads.parentPort.postMessage(buffer);
    }

    worker_threads.parentPort.postMessage(null);
  }
  catch (error) {
    // TODO: Add support for web workers to have a web browser parallel feature
    console.log('Not attempting worker check - running in browser');
  }
}()

// TODO: Move the non-worker cache mechanism within `screencast.js` as well
async function* cache(status) {
  const messages = [];
  let done = defer();

  globalThis.worker_threads.parentPort.addEventListener('message', event => {
    if (event.data === null) {
      done.resolve(true);
      return;
    }

    // Handle crop response
    if (event.data.crop === true) {
      // Access the buffer.buffer property to go Uint8Array -> Buffer
      crops[event.data.id].resolve(Buffer.from(event.data.buffer));
      delete crops[event.data.id];
      return;
    }

    messages.push(event.data);
    status.overhead = messages.length;
    done.resolve(false);
    done = defer();
  });

  while (messages.length > 0 || !await done.promise) {
    if (messages.length > 0) {
      yield messages.shift();
    }
  }
}

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { resolve, reject, promise };
}
