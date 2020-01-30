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
    'input { display: block; margin: auto; width: 90%; }',
    `div { width: ${width}px; height: ${height}px; position: relative; background: url('${dataUrl}') no-repeat; }`,
    'img { display: none; }',
    '</style>',
    '</head>',
    '<body>',
    '<input id="frameInput" type="range" min="0" value="0">',
    `<div>`,
  ].join('\n'),
  frame: (frame, _stamp, { x, y, width, height }, dataUrl) => [
    `<script>window.frame = ${frame};</script>`,
    `<img id="_${frame}" width="${width}" height="${height}" style="position: absolute; left: ${x}px; top: ${y}px;" src="${dataUrl}" />`,
  ].join('\n'),
  epilog: () => [
    '</div>',
    `<script>
    window.addEventListener('load', () => {
      const frameInput = document.getElementById('frameInput');
      frameInput.max = window.frame;
      frameInput.addEventListener('input', () => {
        document.querySelectorAll('img').forEach(img => {
          const frame = Number(img.id.slice('_'.length));
          img.style.display = frameInput.valueAsNumber >= frame ? 'block' : 'none';
        });
      });
    });
    </script>`,
    '</body>',
    '</html>'
  ].join('\n'),
};

module.exports = htmlFluff;
