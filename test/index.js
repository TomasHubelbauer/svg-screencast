require('../src/types');
const regionize = require('../src/regionize');
const bmpToRgba = require('./bmpToRgba');
const klaw = require('klaw');
const path = require('path');
const fs = require('fs-extra');

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
  for await (const item of klaw(__dirname, { depthLimit: 0 })) {
    if (!item.stats.isDirectory()) {
      continue;
    }

    const title = path.relative(__dirname, item.path);

    if (!title) {
      continue;
    }

    const path1Bmp = path.join(item.path, '1.bmp');
    if (!await fs.pathExists(path1Bmp)) {
      throw new Error('Did not find the initial frame BMP file of the test case.' + title);
    }

    const path2Bmp = path.join(item.path, '2.bmp');
    if (!await fs.pathExists(path2Bmp)) {
      throw new Error('Did not find the changed frame BMP file of the test case.' + title);
    }

    const pathExpectedJson = path.join(item.path, 'expected.json');
    if (!await fs.pathExists(pathExpectedJson)) {
      throw new Error('Did not find the expected regions JSON file of the test case ' + title);
    }

    const { width, height, buffer: buffer1 } = bmpToRgba(await fs.readFile(path1Bmp));
    const { width: checkWidth, height: checkHeight, buffer: buffer2 } = bmpToRgba(await fs.readFile(path2Bmp));
    if (width !== checkWidth || height !== checkHeight) {
      throw new Error('Image sizes differ!');
    }

    const regions = await fs.readJson(pathExpectedJson);

    test(title, width, height, buffer1, buffer2, ...regions);
  }
}()
