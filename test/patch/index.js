import fs from 'fs';
import sharp from 'sharp';
import patch from '../../patch.js';

void async function () {
  const results = [];

  for (const name of await fs.promises.readdir('.')) {
    if (name === 'index.js' || name === '.DS_Store') {
      continue;
    }

    results[name] = { errors: [] };

    const beforeSharp = sharp(await fs.promises.readFile(name + '/before.png'));
    const beforeRawBuffer = await beforeSharp.raw().ensureAlpha().toBuffer();

    const afterSharp = sharp(await fs.promises.readFile(name + '/after.png'));
    const afterRawBuffer = await afterSharp.raw().ensureAlpha().toBuffer();

    const [_patch, ...rest] = patch(50, 50, beforeRawBuffer, afterRawBuffer);
    if (rest.length !== 0) {
      results[name].errors.push(`Produced multiple (${rest.length + 1}) patches instead of one.`);
    }

    const _patchRgbaBuffer = await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).raw().ensureAlpha().toBuffer();
    const patchRgbaBuffer = await sharp(await fs.promises.readFile(name + '/patch.png')).raw().ensureAlpha().toBuffer();
    if (Buffer.compare(_patchRgbaBuffer, patchRgbaBuffer) !== 0) {
      await fs.promises.writeFile(name + '/patch.fail.png', await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).png().toBuffer());
      results[name].errors.push(`Produced different data: ${_patchRgbaBuffer.length} versus ${patchRgbaBuffer.length}`);
    }
    else {
      try {
        await fs.promises.unlink(name + '/patch.fail.png');
      }
      catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    const _patchData = JSON.stringify(_patch, null, 2);
    const patchData = await fs.promises.readFile(name + '/patch.json', 'utf-8');
    if (_patchData.replace(/\r?\n/g, '') !== patchData.replace(/\r?\n/g, '')) {
      await fs.promises.writeFile(name + '/patch.fail.json', _patchData);
      results[name].errors.push(`Produced different metadata: ${_patchData} versus ${patchData}`);
    }
    else {
      try {
        await fs.promises.unlink(name + '/patch.fail.json');
      }
      catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  let fail = false;
  for (const result in results) {
    console.log(result, results[result].errors.length === 0 ? 'PASS' : 'FAIL');
    for (const error of results[result].errors) {
      fail = true;
      console.error(' - ' + error);
    }
  }

  if (fail) {
    process.exit(1);
  }
}()
