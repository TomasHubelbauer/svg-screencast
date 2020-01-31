const rgbaToBmp = require('../test/rgbaToBmp');
const bmpToRgba = require('../test/bmpToRgba');

function tesselateBox(width, height) {
  // Generate an image of a box with white innards and a double border
  // which is red on top, green on the right, blue on the bottom and
  // black on the left with a single white border between the two
  // colored borders. Its internal size is width x height defined above
  const rgba = Buffer.alloc(width * height * 4);

  let cursor = 0;
  const red = [255, 0, 0];
  const green = [0, 255, 0];
  const blue = [0, 0, 255];
  const black = [0, 0, 0];
  const white = [255, 255, 255];

  function place(r, g, b) {
    rgba[cursor++] = r;
    rgba[cursor++] = g;
    rgba[cursor++] = b;
    rgba[cursor++] = 255; // Constant full alpha
  }

  // Top outer border - width px red line
  for (let pixel = 0; pixel < width; pixel++) {
    place(...red);
  }

  // Top mid border:
  // 1px of the left outer border - black
  // width - 2 px of the top mid border - white
  // 1px of the right outer border - green
  place(...black);
  for (let pixel = 0; pixel < width - 2; pixel++) {
    place(...white);
  }
  place(...green);

  // Top inner border
  // 1px of the left outer border - black
  // 1px of the left mid border - white
  // 1px of the left inner border - black
  // width - 6 px of the top inner border - red
  // 1px of the right inner border - green
  // 1px of the right mid border - white
  // 1px of the right outer border - green
  place(...black);
  place(...white);
  place(...black);
  for (let pixel = 0; pixel < width - 6; pixel++) {
    place(...red);
  }
  place(...green);
  place(...white);
  place(...green);

  // Mid section height - 6 lines
  for (let line = 0; line < height - 6; line++) {
    place(...black);
    place(...white);
    place(...black);
    for (let pixel = 0; pixel < width - 6; pixel++) {
      place(...white);
    }
    place(...green);
    place(...white);
    place(...green);
  }

  // Bottom inner border
  // 1px of the left outer border - black
  // 1px of the left mid border - white
  // 1px of the left inner border - black
  // width - 6 px of the bottom inner border - blue
  // 1px of the right inner border - green
  // 1px of the right mid border - white
  // 1px of the right outer border - green
  place(...black);
  place(...white);
  place(...black);
  for (let pixel = 0; pixel < width - 6; pixel++) {
    place(...blue);
  }
  place(...green);
  place(...white);
  place(...green);

  // Bottom mid border:
  // 1px of the left outer border - black
  // width - 2 of the top mid border - white
  // 1px of the right outer border - green
  place(...black);
  for (let pixel = 0; pixel < width - 2; pixel++) {
    place(...white);
  }
  place(...green);

  // Top outer border - 9x red line
  for (let pixel = 0; pixel < width; pixel++) {
    place(...blue);
  }

  return rgba;
}

// Start at size 7 because the box borders and minimal 1px innards cannot fit into a smaller size
for (let index = 7; index < 1000; index++) {
  try {
    const boxRgba = tesselateBox(index, index);
    const boxBmp = rgbaToBmp(index, index, boxRgba);
    const { width, height, buffer } = bmpToRgba(boxBmp);
    if (width !== index || height !== index) {
      throw new Error(`The dimensions ${width}x${height} do not match ${index}x${index}.`);
    }

    if (boxRgba.byteLength !== buffer.byteLength) {
      throw new Error(`The RGBA lengths ${boxRgba.byteLength} and ${buffer.byteLength} do not match.`);
    }

    let discrepancies = [];
    let i = 0;
    do {
      const j = i / 4;
      const r = boxRgba[i];
      if (r !== buffer[i++]) {
        discrepancies.push(j);
      }

      const g = boxRgba[i];
      if (g !== buffer[i++]) {
        discrepancies.push(j);
      }

      const b = boxRgba[i];
      if (b !== buffer[i++]) {
        discrepancies.push(j);
      }

      const a = boxRgba[i];
      if (a !== buffer[i++]) {
        discrepancies.push(j);
      }

      if (a !== 255) {
        throw new Error(`Found random alpha ${a}!`);
      }
    } while (i < index * index);

    if (discrepancies.length > 0) {
      throw new Error(`The buffers do not perfectly match at indices ${discrepancies}.\n${print(boxRgba, index * 4, discrepancies)}\n\n${print(buffer, index * 4, discrepancies)}`);
    }
  } catch (error) {
    console.log(index, error);
  }
}

function print(buffer, stride, highlights) {
  let line = '';
  let i = 0;
  do {
    const index = i / 4;
    const r = buffer[i++];
    const g = buffer[i++];
    const b = buffer[i++];
    const a = buffer[i++];
    if (a !== 255) {
      throw new Error(`Found random alpha ${a}!`);
    }

    switch ([r, g, b].join()) {
      case '0,0,0': line += highlights.includes(index) ? '[K]' : ' K '; break;
      case '255,255,255': line += highlights.includes(index) ? '[W]' : ' W '; break;
      case '255,0,0': line += highlights.includes(index) ? '[R]' : ' R '; break;
      case '0,255,0': line += highlights.includes(index) ? '[G]' : ' G '; break;
      case '0,0,255': line += highlights.includes(index) ? '[B]' : ' B '; break;
      default: line += ' ? ';
    }

    if (i % stride === 0) {
      line += '\n';
    }
  } while (i < buffer.byteLength);

  return line;
}
