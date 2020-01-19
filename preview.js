let highlightCanvas;
let context;

window.addEventListener('load', () => {
  highlightCanvas = document.getElementById('highlightCanvas');
  highlightCanvas.window = window.innerWidth;
  highlightCanvas.height = window.innerHeight;
  context = highlightCanvas.getContext('2d');
});

function highlight({ minX, minY, maxX, maxY }) {
  context.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
  context.fillStyle = 'rgba(0, 255, 0, .25)';
  context.fillRect(minX, minY, maxX - minX, maxY - minY);
}
