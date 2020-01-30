require('./types');

/** @type {Fluff} */
const htmlFluff = {
  extension: '.html',
  prolog: (name, width, height, dataUrl) => [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    `<title>${name}</title>`,
    '<style>',
    'img { box-shadow: 0 0 2px 2px rgba(0, 0, 0, .25); }',
    '</style>',
    '<script>',
    `window.addEventListener('load', () => {`,
    `document.querySelectorAll('img').forEach(img => {`,
    `img.addEventListener('mousemove', event => document.title = event.offsetX + ' ' + event.offsetY)`,
    '})',
    '})',
    '</script>',
    '</head>',
    '<body>',
    `<h1>${name}</h1>`,
    `<p>Start with a ${width}×${height} screenshot:</p>`,
    `<img width="${width}" height="${height}" src="${dataUrl}" />`
  ].join('\n'),
  frameProlog: (stamp, regions) => [
    `<p>At ${stamp} ms, patch ${regions.length} background regions with the new screenshot:</p>`,
    '<div style="position: relative;">',
  ].join('\n'),
  frame: (_frame, _stamp, { x, y, width, height }, dataUrl) => [
    `<img width="${width}" height="${height}" style="position: absolute; left: ${x}px; top: ${y}px;" src="${dataUrl}" />`,
  ].join('\n'),
  frameEpilog: (dataUrl) => [
    `<img src="${dataUrl}" />`,
    '</div>',
  ].join('\n'),
  epilog: () => `\n<p>Done!</p>\n<img src="${this.name}" />\n</body>\n</html>\n`,
};

module.exports = htmlFluff;
