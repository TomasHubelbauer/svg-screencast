import fs from 'fs';
import sharp from 'sharp';
import patch from '../patch.js';
import optimize from '../optimize.js';

void async function () {
  const beforeSharp = sharp(await fs.promises.readFile('before.png'));
  const beforeRawBuffer = await beforeSharp.raw().ensureAlpha().toBuffer();

  const afterSharp = sharp(await fs.promises.readFile('after.png'));
  const afterRawBuffer = await afterSharp.raw().ensureAlpha().toBuffer();

  const { width, height } = await beforeSharp.metadata();

  const patches = await optimize(
    patch(width, height, beforeRawBuffer, afterRawBuffer),
    ({ x, y, width, height }) => afterSharp.extract({ left: x, top: y, width, height }).png().toBuffer()
  );

  console.log(patches);
}()
