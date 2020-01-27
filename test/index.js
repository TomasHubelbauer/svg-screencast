require('../types');
const regionize = require('../regionize');

function buff(/** @type {number[]} */ ...bytes) {
  return Buffer.from(new Uint8Array(bytes));
}

let sole = 'in a box';

function test(/** @type {string} */ title, /** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ buffer1, /** @type {Buffer} */ buffer2, /** @type {Region[]} */ ...regions) {
  if (sole && title !== sole) {
    console.log(`${width}x${height} "${title}" skipped.`);
    return;
  }

  const _regions = [];
  for (const region of regionize(width, height, buffer1, buffer2)) {
    _regions.push(region);
  }

  title = `${width}x${height} ${title}`;

  if (_regions.length !== regions.length) {
    console.log(`"${title}" failed! The number of regions (${_regions.length}) does not match the expected number (${regions.length}).`);
    console.log('\tExpected regions:');
    for (const region of regions) {
      console.log('\t', region);
    }

    console.log('\tActual regions:');
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

const black = [0, 0, 0, 255];
const white = [255, 255, 255, 255];

// TODO: Add test cases with actual images (BMPs for easy preview and also dep-free load into RGBA buffer [alpha always 255])
void function () {
  test(
    'full region',
    2, 2,
    buff(
      ...black, ...black,
      ...black, ...black,
    ),
    buff(
      ...white, ...black,
      ...black, ...white,
    ),
    { x: 0, y: 0, width: 2, height: 2 },
  );

  test(
    'top half',
    2, 2,
    buff(
      ...black, ...black,
      ...black, ...black,
    ),
    buff(
      ...white, ...white,
      ...black, ...black,
    ),
    { x: 0, y: 0, width: 2, height: 1 },
  );

  test(
    'bottom half',
    2, 2,
    buff(
      ...black, ...black,
      ...black, ...black,
    ),
    buff(
      ...black, ...black,
      ...white, ...white,
    ),
    { x: 0, y: 1, width: 2, height: 1 },
  );

  test(
    'left half',
    2, 2,
    buff(
      ...black, ...black,
      ...black, ...black,
    ),
    buff(
      ...white, ...black,
      ...white, ...black,
    ),
    { x: 0, y: 0, width: 1, height: 2 },
  );

  test(
    'right half',
    2, 2,
    buff(
      ...black, ...black,
      ...black, ...black,
    ),
    buff(
      ...black, ...white,
      ...black, ...white,
    ),
    { x: 1, y: 0, width: 1, height: 2 },
  );

  test(
    'should drop',
    3, 3,
    buff(
      ...black, ...black, ...black,
      ...black, ...black, ...black,
      ...black, ...black, ...black,
    ),
    buff(
      ...white, ...black, ...black,
      ...black, ...black, ...black,
      ...black, ...black, ...white,
    ),
    { x: 0, y: 0, width: 1, height: 1 },
    { x: 2, y: 2, width: 1, height: 1 },
  );

  test(
    'forward slash',
    3, 3,
    buff(
      ...black, ...black, ...black,
      ...black, ...black, ...black,
      ...black, ...black, ...black,
    ),
    buff(
      ...black, ...black, ...white,
      ...black, ...white, ...black,
      ...white, ...black, ...black,
    ),
    { x: 0, y: 0, width: 3, height: 3 },
  );

  test(
    'in a box',
    5, 5,
    buff(
      ...black, ...black, ...black, ...black, ...black,
      ...black, ...black, ...black, ...black, ...black,
      ...black, ...black, ...black, ...black, ...black,
      ...black, ...black, ...black, ...black, ...black,
      ...black, ...black, ...black, ...black, ...black,
    ),
    buff(
      ...white, ...white, ...white, ...white, ...white,
      ...white, ...black, ...black, ...black, ...white,
      ...white, ...black, ...white, ...black, ...white,
      ...white, ...black, ...black, ...black, ...white,
      ...white, ...white, ...white, ...white, ...white,
    ),
    { x: 0, y: 0, width: 5, height: 5 },
  );
}()
