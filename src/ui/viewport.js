const fitted = new WeakSet();

// Measure the current screen at its normal size, then fit it inside the space
// left between the header and footer. Recalculate on resize and screen changes.
export function fitViewport(container) {
  if (fitted.has(container)) return;
  fitted.add(container);
  let frame;
  function fit() {
    const screen = container.querySelector('.screen');
    if (!screen || !container.clientWidth || !container.clientHeight) return;
    screen.style.zoom = '1';
    screen.style.width = `${container.clientWidth}px`;
    const height = Math.max(screen.offsetHeight, screen.scrollHeight);
    const width = Math.max(screen.offsetWidth, screen.scrollWidth);
    const scale = Math.min(1, (container.clientHeight - 12) / height, (container.clientWidth - 12) / width);
    screen.style.zoom = String(Math.max(0.1, scale));
  }
  function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }
  new ResizeObserver(schedule).observe(container);
  new MutationObserver(schedule).observe(container, {
    childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'],
  });
  document.fonts?.ready.then(schedule);
  schedule();
}
