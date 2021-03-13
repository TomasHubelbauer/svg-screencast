import screencast from '../screencast.js';

window.addEventListener('load', async () => {
  /** @type {Blob} */
  const blobs = [];
  const marker = '<image class="_';
  for await (const blob of screencast(screenshots)) {
    blobs.push(blob);
    if (blob.startsWith(marker)) {
      console.log(blob.slice(marker.length, blob.indexOf('"', marker.length)));
    }
  }

  document.getElementById('canvas').remove();
  const svg = blobs.join('');
  document.body.innerHTML += svg;

  const base64 = window.btoa(svg);

  const downloadA = document.createElement('a');
  downloadA.textContent = 'Download';
  downloadA.download = 'screencast.svg';
  downloadA.href = 'data:text/xml;base64,' + base64;
  document.body.append(downloadA);

  const inspectA = document.createElement('a');
  inspectA.textContent = 'Inspect';
  inspectA.href = '../inspector#' + base64;
  document.body.append(inspectA);
});

async function* screenshots() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('canvas');
  const width = canvas.width;
  const height = canvas.height;

  for (let index = 0; index < 10; index++) {
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'black';
    for (let line = 0; line < index; line++) {
      context.fillText('Line #' + line.toString(), 10, 15 + line * 15);
    }

    yield {
      stamp: new Date(),
      buffer: context.getImageData(0, 0, width, height).data,
      width: canvas.width,
      height: canvas.height,
      format: 'image/png',
      async crop(patch) {
        if (!patch) {
          return canvas.toDataURL().slice('data:image/png;base64,'.length);
        }

        // Get the image data of the patch
        const imageData = context.getImageData(patch.x, patch.y, patch.width, patch.height);
        const _imageData = context.getImageData(0, 0, width, height);

        // Resize the canvas to the patch size
        canvas.width = patch.width;
        canvas.height = patch.height;

        // Restore image data to the newly sized canvas
        context.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL().slice('data:image/png;base64,'.length);

        // Restore the canvas' original dimensions
        canvas.width = width;
        canvas.height = height;
        context.putImageData(_imageData, 0, 0);

        return dataUrl;
      }
    };

    await new Promise(resolve => setTimeout(resolve, 330));
  }
}
