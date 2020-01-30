require('./types');

/** @type {Fluff} */
const svgFluff = {
  extension: '.svg',
  prolog: (_name, width, height, dataUrl) => [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<image width="${width}" height="${height}" href="${dataUrl}" />`,
    '<style>',
    'image[id] { visibility: hidden; }',
    '@keyframes cast { to { visibility: visible; } }',
    '</style>',
  ].join('\n'),
  frame: (frame, stamp, { x, y, width, height }, dataUrl) => [
    `<style>#_${frame} { animation: cast 0ms ${stamp}ms forwards; }</style>`,
    `<image id="_${frame}" x="${x}" y="${y}" width="${width}" height="${height}" href="${dataUrl}" />`,
  ].join('\n'),
  epilog: () => '\n</svg>',
};

module.exports = svgFluff;
