window.frames = [];

window.addEventListener('load', () => {
  const frameInput = document.getElementById('frameInput');
  const frameP = document.getElementById('frameP');

  frameInput.max = window.frames.length - 1;
  frameInput.addEventListener('input', () => {
    const frame = frameInput.valueAsNumber;
    document.querySelectorAll('img').forEach(img => {
      const frame = Number(img.dataset.frame);
      img.classList.toggle('cast', frame <= frameInput.valueAsNumber);
      img.classList.toggle('last', frame === frameInput.valueAsNumber);
    });

    frameP.textContent = `Frame #${frame} at ${window.frames[frame].stamp}ms: ${window.frames[frame].patches} patches.`;
  });
});
