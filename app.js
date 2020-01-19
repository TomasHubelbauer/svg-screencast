window.addEventListener('load', () => {
  const highlightCanvas = document.getElementById('highlightCanvas');
  highlightCanvas.window = window.innerWidth;
  highlightCanvas.height = window.innerHeight;

  const randomInput = document.getElementById('randomInput');
  window.setInterval(() => randomInput.value = Math.random(), 500);
});

function highlight({ minX, minY, maxX, maxY, changes }) {
  /** @type {HTMLCanvasElement} */
  const highlightCanvas = document.getElementById('highlightCanvas');
  const context = highlightCanvas.getContext('2d');
  context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
  context.fillStyle = 'rgba(255, 0, 0, .5)';
  for (const change of changes) {
    context.fillRect(change[0], change[1], 1, 1);
  }

  context.fillStyle = 'rgba(0, 255, 0, .25)';
  context.fillRect(minX, minY, maxX - minX, maxY - minY);
}
