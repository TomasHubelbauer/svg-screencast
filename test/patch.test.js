import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import patch from '../patch.js';

void async function () {
  const results = [];

  const testDirectoryPath = 'patch';
  for (const name of await fs.promises.readdir(testDirectoryPath)) {
    if (name === '.gitignore' || name === '.DS_Store') {
      continue;
    }

    results[name] = { errors: [] };

    const caseDirectoryPath = path.join(testDirectoryPath, name);

    const beforePngFilePath = path.join(caseDirectoryPath, 'before') + '.png';
    const beforeSharp = sharp(await fs.promises.readFile(beforePngFilePath));
    const beforeRawBuffer = await beforeSharp.raw().ensureAlpha().toBuffer();

    const afterPngFilePath = path.join(caseDirectoryPath, 'after') + '.png';
    const afterSharp = sharp(await fs.promises.readFile(afterPngFilePath));
    const afterRawBuffer = await afterSharp.raw().ensureAlpha().toBuffer();

    const [_patch, ...rest] = patch(50, 50, beforeRawBuffer, afterRawBuffer);
    if (rest.length !== 0) {
      results[name].errors.push(`Produced multiple (${rest.length + 1}) patches instead of one.`);
    }

    const patchPngFilePath = path.join(caseDirectoryPath, 'patch') + '.png';
    const patchPngFailPngFilePath = patchPngFilePath + '.fail.png';
    const _patchRgbaBuffer = await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).raw().ensureAlpha().toBuffer();
    const patchRgbaBuffer = await sharp(await fs.promises.readFile(patchPngFilePath)).raw().ensureAlpha().toBuffer();
    if (Buffer.compare(_patchRgbaBuffer, patchRgbaBuffer) !== 0) {
      await fs.promises.writeFile(patchPngFailPngFilePath, await afterSharp.extract({ ..._patch, left: _patch.x, top: _patch.y }).png().toBuffer());
      results[name].errors.push(`Produced different data: ${_patchRgbaBuffer.length} versus ${patchRgbaBuffer.length}`);
    }
    else {
      try {
        await fs.promises.unlink(patchPngFailPngFilePath);
      }
      catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    const patchJsonFilePath = path.join(caseDirectoryPath, 'patch') + '.json';
    const patchJsonFailJsonFilePath = patchJsonFilePath + '.fail.json';
    const _patchData = JSON.stringify(_patch, null, 2);
    const patchData = await fs.promises.readFile(patchJsonFilePath, 'utf-8');
    if (_patchData.replace(/\r?\n/g, '') !== patchData.replace(/\r?\n/g, '')) {
      await fs.promises.writeFile(patchJsonFailJsonFilePath, _patchData);
      results[name].errors.push(`Produced different metadata: ${_patchData} versus ${patchData}`);
    }
    else {
      try {
        await fs.promises.unlink(patchJsonFailJsonFilePath);
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
