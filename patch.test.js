import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import patch from './patch.js';

void async function () {
  const results = [];

  const testDirectoryPath = 'test/patch';
  for (const name of await fs.promises.readdir(testDirectoryPath)) {
    if (name === '.gitignore') {
      continue;
    }

    results[name] = { errors: [] };

    const caseDirectoryPath = path.join(testDirectoryPath, name);

    const beforePngFilePath = path.join(caseDirectoryPath, 'before') + '.png';
    const afterPngFilePath = path.join(caseDirectoryPath, 'after') + '.png';
    const patchPngFilePath = path.join(caseDirectoryPath, 'patch') + '.png';
    const patchJsonFilePath = path.join(caseDirectoryPath, 'patch') + '.json';

    const beforeSharp = sharp(await fs.promises.readFile(beforePngFilePath));
    const beforeRawBuffer = await beforeSharp.raw().toBuffer();
    const afterSharp = sharp(await fs.promises.readFile(afterPngFilePath));
    const afterRawBuffer = await afterSharp.raw().toBuffer();

    const [_patch, ...rest] = patch(50, 50, beforeRawBuffer, afterRawBuffer);
    if (rest.length !== 0) {
      results[name].errors.push(`Produced multiple (${rest.length + 1}) patches instead of one.`);
    }

    const _patchPngBuffer = await afterSharp.extract(_patch).png().toBuffer();
    const patchPngBuffer = await fs.promises.readFile(patchPngFilePath);
    const pngComparison = Buffer.compare(_patchPngBuffer, patchPngBuffer);
    if (pngComparison !== 0) {
      await fs.promises.writeFile(patchPngFilePath + '.fail.png', _patchPngBuffer);
      results[name].errors.push('Produced different data.');
    }

    const _patchJsonBuffer = Buffer.from(JSON.stringify(_patch, null, 2));
    const patchJsonBuffer = await fs.promises.readFile(patchJsonFilePath);
    const jsonComparison = Buffer.compare(_patchJsonBuffer, patchJsonBuffer);
    if (jsonComparison !== 0) {
      await fs.promises.writeFile(patchJsonFilePath + '.fail.json', _patchJsonBuffer);
      results[name].errors.push('Produced different metadata.');
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
