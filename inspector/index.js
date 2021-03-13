window.addEventListener('load', async () => {
  document.body.addEventListener('click', () => document.querySelector('input[type="range"]')?.focus());

  const svg = await awaitChoice();
  const doc = new DOMParser().parseFromString(svg, 'text/xml');

  const frames = [];

  // Parse the SVG XML structure based on the expected elements and attributes
  let image = '';
  let style = false;
  for (const element of doc.documentElement.children) {
    switch (element.tagName) {
      case 'image': {
        if (!image) {
          image = element.getAttribute('href');
          break;
        }

        const frame = frames[frames.length - 1];

        if (element.getAttribute('class') !== `_${frame.frame}`) {
          throw new Error(`Image with class ${element.getAttribute('class')} was not associated to frame ${frame.frame}.`);
        }

        const x = Number(element.getAttribute('x'));
        const y = Number(element.getAttribute('y'));
        const width = Number(element.getAttribute('width'));
        const height = Number(element.getAttribute('height'));
        const dataUrl = element.getAttribute('href');
        frame.patches.push({ x, y, width, height, dataUrl });
        break;
      }
      case 'style': {
        if (!style) {
          style = true;
          break;
        }

        const regex = /^._(?<frame>\d+) \{ animation: _ 0ms (?<stamp>\d+)ms forwards; \}$/;
        const match = regex.exec(element.textContent);
        frames.push({ frame: Number(match.groups.frame), stamp: Number(match.groups.stamp), patches: [] });
        break;
      }
      default: {
        throw new Error(`Unexpected element ${element.tagName}.`);
      }
    }
  }

  let count = 0;

  let rendering = false;
  let rerender = false;

  async function loadImg(src, id) {
    const img = document.createElement('img');
    img.src = src;
    img.id = id;
    await new Promise(resolve => img.addEventListener('load', resolve));
    return img;
  }

  function handleButtonClick() {
    const files = [
      { name: 'before.png', url: document.querySelector('#before').src },
      { name: 'after.png', url: document.querySelector('#after').src },
    ];

    for (const file of files) {
      const a = document.createElement('a');
      a.download = file.name;
      a.href = file.url;
      a.target = '_blank';
      a.click();
      a.remove();
    }
  }

  async function render(_div) {
    if (rendering) {
      rerender = true;
      return;
    }

    rendering = true;
    _div.innerHTML = `${count}/${frames.length}`;

    const img = await loadImg(image);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    // Keep track of the background before current frame
    let _img;

    const div = document.createElement('div');
    if (count === 1) {
      div.append(await loadImg(canvas.toDataURL(), 'before'));
    }

    for (let index = 0; index < count; index++) {
      const frame = frames[index];
      for (const patch of frame.patches) {
        context.drawImage(await loadImg(patch.dataUrl), patch.x, patch.y);
      }

      if (index === count - 2) {
        div.append(_img = await loadImg(canvas.toDataURL(), 'before'));
      }
    }

    div.append(await loadImg(canvas.toDataURL(), count > 0 ? 'after' : ''));
    _div.append(div);

    _div.append(img.naturalWidth + 'x' + img.naturalHeight);

    if (count > 0) {
      const button = document.createElement('button');
      button.textContent = 'Download test case';
      button.addEventListener('click', handleButtonClick);
      _div.append(button);
    }

    const frame = frames[count - 1];
    if (frame) {
      for (const patch of frame.patches) {
        _div.append(`${patch.x}×${patch.y} (${patch.width}x${patch.height}):`);

        const _canvas = document.createElement('canvas');
        _canvas.width = patch.width;
        _canvas.height = patch.height;
        _canvas.getContext('2d').drawImage(_img || img, -patch.x, -patch.y);

        const div = document.createElement('div');
        div.append(await loadImg(_canvas.toDataURL()), await loadImg(patch.dataUrl));
        _div.append(div);
      }
    }

    rendering = false;
    if (rerender) {
      rerender = false;
      await render(_div);
    }
  }

  const div = document.createElement('div');

  const input = document.createElement('input');
  input.type = 'range';
  input.max = frames.length;
  input.value = count;
  input.addEventListener('input', () => {
    count = input.valueAsNumber;
    render(div);
  });

  // Render the tool UI
  document.body.append(input, div);
  render(div);

  // Give slider focus to be able to use arrow keys straight away
  input.focus();
});

async function awaitChoice() {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  const input = document.getElementById('input');
  input.addEventListener('change', () => {
    if (input.files.length !== 1) {
      reject('Select only a single file.');
      return;
    }

    const fileReader = new FileReader();
    fileReader.addEventListener('error', reject);
    fileReader.addEventListener('loadend', () => {
      input.remove();
      button.remove();
      resolve(fileReader.result);
    });

    fileReader.readAsText(input.files[0]);
  });

  const button = document.getElementById('button');
  button.addEventListener('click', async () => {
    const svg = await fetch('../screencast.svg').then(response => response.text());
    input.remove();
    button.remove();
    resolve(svg);
  });

  return promise;
}
