export function createAudioPlayer() {
  let active;
  let settle;
  function stop() {
    if (active) {
      active.pause();
      active.removeAttribute('src');
      active.load();
      active = null;
    }
    settle?.('cancelled');
    settle = null;
  }
  async function play(path) {
    stop();
    if (!path) return 'placeholder';
    return new Promise(resolve => {
      const audio = new Audio(new URL(path, document.baseURI).href);
      active = audio;
      let done = false;
      const finish = result => {
        if (done) return;
        done = true;
        audio.onended = audio.onerror = null;
        if (active === audio) { active = null; settle = null; }
        resolve(result);
      };
      settle = finish;
      audio.onended = () => finish('played');
      audio.onerror = () => finish('failed');
      audio.play().catch(() => finish('failed'));
    });
  }
  return { play, stop };
}
