const fs = require('fs-extra');
const rgbaToBmp = require('../test/rgbaToBmp');

void async function () {
  const rgba = await fs.readFile('test/broken@118/1.rgba');
  const width = 1200;
  const height = 756;
  const bmp = rgbaToBmp(width, height, rgba);
  await fs.writeFile('temp2/test.bmp', bmp);
  let html = `window.rgba = [${rgba.join()}];`;
  await fs.writeFile('temp2/test.js', html);
}()
