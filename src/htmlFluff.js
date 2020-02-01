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
    `<style>div { width: ${width}px; height: ${height}px; position: relative; background: url('${dataUrl}') no-repeat; }</style>`,
    '<link rel="stylesheet" href="screencast.css" />',
    '<script src="screencast.js"></script>',
    '</head>',
    '<body>',
    '<input id="frameInput" type="range" min="0" value="0">',
    '<p id="frameP"></p>',
    `<div>`,
  ].join('\n'),
  frame: (frame, stamp, patches) => [
    `<script>window.frames.push({ stamp: ${stamp}, patches: ${patches.length} });</script>`,
    ...patches.map(({ region: { x, y, width, height }, dataUrl }) => `<img data-frame="${frame}" width="${width}" height="${height}" style="left: ${x}px; top: ${y}px;" src="${dataUrl}" />`),
  ].join('\n'),
  epilog: () => [
    '</div>',
    '</body>',
    '</html>'
  ].join('\n'),
};

module.exports = htmlFluff;
