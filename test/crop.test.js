import fs from 'fs';
import sharp from 'sharp';
import crop from '../crop.js';

void async function () {
  const errors = [];

  const beforeSharp = sharp(await fs.promises.readFile('crop/before.png'));
  const beforeRawBuffer = await beforeSharp.raw().ensureAlpha().toBuffer();

  const afterSharp = sharp(await fs.promises.readFile('crop/after.png'));
  const afterRawBuffer = await afterSharp.raw().ensureAlpha().toBuffer();

  const _crop = Buffer.from(crop(50, 50, beforeRawBuffer, { left: 22, top: 22, width: 6, height: 6 }));
  if (Buffer.compare(_crop, afterRawBuffer) !== 0) {
    await fs.promises.writeFile('crop/after.png.fail.png', await sharp(_crop, { raw: { width: 6, height: 6, channels: 4 } }).png().toBuffer());
    errors.push(`Produced different data: ${_crop.length} versus ${afterRawBuffer.length}`);
  }
  else {
    try {
      await fs.promises.unlink('crop/after.png.fail.png');
    }
    catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  let fail = false;
  for (const error of errors) {
    fail = true;
    console.error(' - ' + error);
  }

  if (fail) {
    process.exit(1);
  }
}()
