export function introduceWord(screen, word, config) {
  let animation;
  const reveals = [];
  let cancelled = false;
  const clear = () => {
    screen.classList.remove('word-intro');
    document.removeEventListener('visibilitychange', onVisibility);
  };
  function cancel() {
    cancelled = true;
    animation?.cancel();
    reveals.forEach(effect => effect.cancel());
    clear();
  }
  function onVisibility() { if (document.hidden) cancel(); }
  const finished = (async () => {
    if (!config?.enabled || matchMedia('(prefers-reduced-motion: reduce)').matches || !word.animate) return !document.hidden;
    if (document.hidden) return false;
    screen.classList.add('word-intro');
    const bounds = word.getBoundingClientRect();
    const scale = Math.max(1, Math.min(config.scale, (window.innerWidth - 40) / Math.max(bounds.width, 1)));
    const x = window.innerWidth / 2 - (bounds.left + bounds.width / 2);
    const y = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
    const start = `translate(${x}px, ${y}px) scale(${scale})`;
    document.addEventListener('visibilitychange', onVisibility);
    try {
      animation = word.animate([
        { transform: start, offset: 0 },
        { transform: start, offset: config.holdMs / (config.holdMs + config.moveMs), easing: 'cubic-bezier(.22,.7,.2,1)' },
        { transform: 'translate(0, 0) scale(1)', offset: 1 },
      ], { duration: config.holdMs + config.moveMs, fill: 'both' });
      await animation.finished;
      if (cancelled || document.hidden) return false;
      screen.classList.remove('word-intro');
      if (config.revealMs > 0) {
        const options = { duration: config.revealMs, easing: 'ease-out', fill: 'both' };
        for (const element of screen.querySelectorAll('.card-picture-area, .learning-toolbar, .card-actions, .audio-feedback')) {
          reveals.push(element.animate([{ opacity: 0 }, { opacity: 1 }], options));
        }
        const card = screen.querySelector('.word-card');
        const style = getComputedStyle(card);
        reveals.push(card.animate([
          { backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: '0 12px 32px transparent' },
          { backgroundColor: style.backgroundColor, borderColor: style.borderColor, boxShadow: style.boxShadow },
        ], options));
        await Promise.all(reveals.map(effect => effect.finished));
      }
      return !cancelled && !document.hidden;
    } catch { return false; }
    finally { animation?.cancel(); reveals.forEach(effect => effect.cancel()); clear(); }
  })();
  return { finished, cancel };
}
