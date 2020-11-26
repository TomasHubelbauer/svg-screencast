import path from 'path';
import fs from 'fs';
import url from 'url';

function test(/** @type {string} */ title, /** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ buffer1, /** @type {Buffer} */ buffer2, /** @type {Region[]} */ ...regions) {
  const _regions = [];
  for (const region of regionize(width, height, buffer1, buffer2)) {
    _regions.push(region);
  }

  title = `${width}x${height} ${title}`;

  if (_regions.length !== regions.length) {
    console.log(`"${title}" failed! The number of regions (${_regions.length}) does not match the expected number (${regions.length}).`);
    console.log(`\tExpected regions (${regions.length}):`);
    for (const region of regions) {
      console.log('\t', region);
    }

    console.log(`\tActual regions (${_regions.length}):`);
    for (const region of _regions) {
      console.log('\t', region);
    }

    return;
  }

  const errors = [];
  for (let index = 0; index < regions.length; index++) {
    if (_regions[index].x === regions[index].x || _regions[index].y === regions[index].y || _regions[index].width === regions[index].width || _regions[index].height === regions[index].height) {
      continue;
    }

    errors.push(`The patch #${index + 1} (${JSON.stringify(_regions[index])}) does not match the expected patch (${JSON.stringify(regions[index])}).`);
  }

  if (errors.length > 0) {
    console.log(`"${title}" failed! Some regions do not match.`);
    for (const error of errors) {
      console.log('\t', error);
    }

    return;
  }

  console.log(`"${title}" passed.`);
}

void async function () {
  const testDirectoryPath = path.dirname(url.fileURLToPath(import.meta.url));
  for (const item of await fs.promises.readdir(testDirectoryPath, { withFileTypes: true })) {
    if (!item.isDirectory() || item.name === '.git') {
      continue;
    }

    const path1Bmp = path.join(testDirectoryPath, item.name, '1.bmp');
    const path2Bmp = path.join(testDirectoryPath, item.name, '2.bmp');
    const pathExpectedJson = path.join(testDirectoryPath, item.name, 'expected.json');

    const { width, height, buffer } = bmpToRgba(await fs.promises.readFile(path1Bmp));
    const { width: checkWidth, height: checkHeight, buffer: checkBuffer } = bmpToRgba(await fs.promises.readFile(path2Bmp));
    if (width !== checkWidth || height !== checkHeight) {
      throw new Error('Image sizes differ!');
    }

    const regions = JSON.parse(await fs.promises.readFile(pathExpectedJson));

    test(item.name, width, height, buffer, checkBuffer, ...regions);
  }
}()
