window.addEventListener('load', async () => {
  const svg = await fetch('demo.svg').then(response => response.text());
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

  async function render(_div) {
    if (rendering) {
      rerender = true;
      return;
    }

    rendering = true;

    _div.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'player';

    const img = document.createElement('img');
    img.src = image;
    img.className = 'poster';
    await new Promise(resolve => img.addEventListener('load', resolve));

    div.append(img);
    _div.append(div);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    for (let index = 0; index < count; index++) {
      const frame = frames[index];
      for (const patch of frame.patches) {
        const img = document.createElement('img');
        img.src = patch.dataUrl;
        img.className = 'patch';
        img.style.left = patch.x + 'px';
        img.style.top = patch.y + 'px';
        await new Promise(resolve => img.addEventListener('load', resolve));

        // Draw everything except for the current frame to get live background
        if (index < count - 1) {
          context.drawImage(img, patch.x, patch.y);
        }

        div.append(img);
      }
    }

    div.append(canvas);

    const infoDiv = document.createElement('div');
    const progress = document.createElement('progress');
    progress.max = frames.length;
    progress.value = count;

    infoDiv.append(progress, `${count}/${frames.length}`);
    _div.append(infoDiv);

    const frame = frames[count - 1];
    if (frame) {
      for (const patch of frame.patches) {
        const div = document.createElement('div');
        div.className = 'patch';

        const _canvas = document.createElement('canvas');
        _canvas.width = patch.width;
        _canvas.height = patch.height;
        _canvas.getContext('2d').drawImage(canvas, -patch.x, -patch.y);

        const img = document.createElement('img');
        img.src = patch.dataUrl;

        div.append(`${patch.x}×${patch.y} (${patch.width}x${patch.height}):`, _canvas, '🡆', img);
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
    count = input.value;
    render(div);
  });

  // Render the tool UI
  document.body.append(input, div);
  render(div);

  // Give slider focus to be able to use arrow keys straight away
  input.focus();
});
