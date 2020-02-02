window.patches = [];

window.addEventListener('load', () => {
  const patchInput = document.getElementById('patchInput');
  const modeButton = document.getElementById('modeButton');
  const patchP = document.getElementById('patchP');
  const patchDiv = document.getElementById('patchDiv');

  patchInput.max = window.patches.length - 1;
  patchInput.addEventListener('input', () => {
    const patch = patchInput.valueAsNumber;

    document.querySelectorAll('.patch').forEach((div, index) => {
      div.classList.toggle('cast', index <= patch);
      div.classList.toggle('last', index === patch);
    });

    const { frame, index, stamp, x, y, width, height } = window.patches[patch];
    patchP.textContent = `Patch #${patch} (#${index} in frame #${frame} @ ${stamp}ms) @ ${x}×${y} ${width}×${height}`;
    patchDiv.className = `patch-${frame}-${index}`;
  });

  patchInput.focus();
  patchInput.dispatchEvent(new Event('input'));

  let frameTimeout;
  function cast(_patch = 0) {
    let patch = _patch;

    const { frame, stamp: _stamp } = window.patches[patch];

    // Skip over the patches in this frame
    do {
      patch++;
    } while (window.patches[patch] && window.patches[patch].frame === frame);

    // Come back to the last patch of this frame
    patch--;

    // Cast all the patches of this frame
    patchInput.value = patch;
    patchInput.dispatchEvent(new Event('input'));

    if (patch === window.patches.length - 1) {
      modeButton.dispatchEvent(new Event('click'));
      return;
    }

    // Advance to the first patch of the next frame to get accurate frame duration
    patch++;

    const stamp = window.patches[patch].stamp;
    frameTimeout = window.setTimeout(cast, stamp - _stamp, patch);
  }

  modeButton.addEventListener('click', () => {
    switch (modeButton.textContent) {
      case 'Play': {
        modeButton.textContent = 'Stop';
        patchInput.disabled = true;
        cast();
        break;
      }
      case 'Stop': {
        modeButton.textContent = 'Play';
        patchInput.disabled = false;
        window.clearTimeout(frameTimeout);
        break;
      }
    }
  });
});
