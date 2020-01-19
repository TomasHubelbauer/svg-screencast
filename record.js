window.addEventListener('load', () => {
  const randomInput = document.getElementById('randomInput');
  window.setInterval(() => randomInput.value = Math.random(), 500);
});
