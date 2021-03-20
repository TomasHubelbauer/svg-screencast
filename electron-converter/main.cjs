const electron = require('electron');

process.on('unhandledRejection', error => { throw error; });
process.on('uncaughtException', error => { throw error; });

void async function () {
  const { default: index } = await import('./index.js');
  await index(electron);
}()
