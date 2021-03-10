import screencast from '../screencast.js';

window.addEventListener('load', () => {
  /** @type {HTMLInputElement} */
  const input = document.querySelector('input');

  /** @type {HTMLVideoElement} */
  const video = document.querySelector('video');

  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('canvas');

  input.addEventListener('change', async () => {
    if (input.files.length !== 1) {
      alert('Select a single WebM file!');
      return;
    }

    // Note that even though `File` should be supported, it is not in practice:
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
    const url = URL.createObjectURL(input.files[0]);
    URL.revokeObjectURL(video.src);
    video.src = url;
  });

  video.addEventListener('loadedmetadata', async () => {
    await video.play();

    /** @type {Blob} */
    const blobs = [];
    const marker = '<image class="_';
    for await (const blob of screencast(screenshots)) {
      blobs.push(blob);
      if (blob.startsWith(marker)) {
        console.log(blob.slice(marker.length, blob.indexOf('"', marker.length)));
      }
    }

    canvas.remove();
    const svg = blobs.join('');
    document.body.innerHTML += svg;

    const a = document.createElement('a');
    a.textContent = 'Download';
    a.download = 'screencast.svg';
    a.href = 'data:text/xml;base64,' + window.btoa(svg);
    document.body.append(a);

  });

  async function* screenshots() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    while (video.currentTime < video.duration) {
      context.drawImage(video, 0, 0);
      yield {
        stamp: new Date(),
        buffer: context.getImageData(0, 0, canvas.width, canvas.height).data,
        width: canvas.width,
        height: canvas.height,
        format: 'image/png',
        async crop(patch) {
          if (!patch) {
            return canvas.toDataURL().slice('data:image/png;base64,'.length);
          }

          // Get the image data of the patch
          const imageData = context.getImageData(patch.left, patch.top, patch.width, patch.height);
          const _imageData = context.getImageData(0, 0, canvas.width, canvas.height);

          // Resize the canvas to the patch size
          canvas.width = patch.width;
          canvas.height = patch.height;

          // Restore image data to the newly sized canvas
          context.putImageData(imageData, 0, 0);

          const dataUrl = canvas.toDataURL().slice('data:image/png;base64,'.length);

          // Restore the canvas' original dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.putImageData(_imageData, 0, 0);

          return dataUrl;
        }
      };

      let resolve;
      let reject;
      const deferred = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });

      window.requestAnimationFrame(resolve);
      await deferred;
    }

    URL.revokeObjectURL(video.src);
    video.srcObject = null;
    video.removeAttribute('src');
  }
});
