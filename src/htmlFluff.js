require('./types');

/** @type {Fluff} */
const htmlFluff = {
  extension: '.html',
  prolog: (name, _width, height, dataUrl) => [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    `<title>${name}</title>`,
    `<style>body { margin: ${height}px 0 0; background: url('${dataUrl}') no-repeat; }</style>`,
    '<link rel="stylesheet" href="screencast.css" />',
    '<script src="screencast.js"></script>',
    '</head>',
    '<body>',
    '<input id="patchInput" type="range" min="0" value="0">',
    '<button id="modeButton">Play</button>',
    '<p id="patchP"></p>',
    '<div id="patchDiv"></div>',
  ].join('\n'),
  frame: (frame, stamp, patches) => [
    ...patches.map(({ region: { x, y, width, height }, dataUrl }, index) => [
      `<script>window.patches.push(${JSON.stringify({ frame, index, stamp, x, y, width, height })});</script>`,
      `<style>.patch-${frame}-${index} { width: ${width}px; height: ${height}px; background: url('${dataUrl}'); }</style>`,
      `<div class="patch patch-${frame}-${index}" style="left: ${x}px; top: ${y}px;"></div>`,
    ].join('\n')),
  ].join('\n'),
  epilog: () => [
    '</body>',
    '</html>'
  ].join('\n'),
};

module.exports = htmlFluff;
