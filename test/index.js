import fs from 'fs';
import sharp from 'sharp';
import patch from '../patch.js';

void async function () {
  const results = [];

  for (const entry of await fs.promises.readdir('.', { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules') {
      continue;
    }

    const name = entry.name;
    results[name] = { errors: [] };

    const beforeSharp = sharp(await fs.promises.readFile(`${name}/before.png`));
    const beforeRawBuffer = await beforeSharp.raw().ensureAlpha().toBuffer();

    const afterSharp = sharp(await fs.promises.readFile(`${name}/after.png`));
    const afterRawBuffer = await afterSharp.raw().ensureAlpha().toBuffer();

    const { width, height } = await beforeSharp.metadata();

    const patches = patch(width, height, beforeRawBuffer, afterRawBuffer);
    for (let index = 0; index < patches.length; index++) {
      const _patch = patches[index];

      try {
        await fs.promises.access(`${name}/patch-${index}.png`);
      }
      catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }

        await fs.promises.writeFile(`${name}/patch-${index}.fail.png`, await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).png().toBuffer());
        await fs.promises.writeFile(`${name}/patch-${index}.fail.json`, JSON.stringify(_patch, null, 2));
        results[name].errors.push(`Patch #${index} is missing`);
        continue;
      }

      const _patchRgbaBuffer = await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).raw().ensureAlpha().toBuffer();
      const patchRgbaBuffer = await sharp(await fs.promises.readFile(`${name}/patch-${index}.png`)).raw().ensureAlpha().toBuffer();
      if (Buffer.compare(_patchRgbaBuffer, patchRgbaBuffer) !== 0) {
        await fs.promises.writeFile(`${name}/patch-${index}.fail.png`, await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).png().toBuffer());
        results[name].errors.push(`Produced different data: ${_patchRgbaBuffer.length} versus ${patchRgbaBuffer.length}`);
      }
      else {
        try {
          await fs.promises.unlink(`${name}/patch-${index}.fail.png`);
        }
        catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      const _patchData = JSON.stringify(_patch, null, 2);
      const patchData = await fs.promises.readFile(`${name}/patch-${index}.json`, 'utf-8');
      if (_patchData.replace(/\r?\n/g, '') !== patchData.replace(/\r?\n/g, '')) {
        await fs.promises.writeFile(`${name}/patch-${index}.fail.json`, _patchData);
        results[name].errors.push(`Produced different metadata: ${_patchData} versus ${patchData}`);
      }
      else {
        try {
          await fs.promises.unlink(`${name}/patch-${index}.fail.json`);
        }
        catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
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
