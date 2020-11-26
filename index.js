import fs from 'fs';
import path from 'path';
import screencast from './screencast.js';

void async function () {
  await screencast('docs/demo.svg', stream());
}()

async function* stream() {
  for (const entry of await fs.promises.readdir('demo', { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.png')) {
      continue;
    }

    const stamp = Number(entry.name.slice(0, -'.png'.length));
    const buffer = await fs.promises.readFile(path.join('demo', entry.name));
    yield { stamp, buffer };
  }
}
