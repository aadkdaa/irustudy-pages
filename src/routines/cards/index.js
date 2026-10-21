import { makeRounds } from './plan.js';
import { element, button, picture } from '../../ui/elements.js';

export function createCardRoutine({ container, words, config, audio, onComplete }) {
  const rounds = makeRounds(words, config);
  let roundIndex = 0;
  let wordIndex = 0;
  let destroyed = false;
  let generation = 0;
  let finished = false;

  function render() {
    const token = ++generation;
    const round = rounds[roundIndex];
    const word = round.words[wordIndex];
    const challenge = round.mode === 'challenge';
    audio.stop();
    const screen = element('section', 'learning-screen screen');
    const toolbar = element('div', 'learning-toolbar');
    const prompt = element('h1', 'learning-prompt', round.prompt);
    prompt.tabIndex = -1;
    toolbar.append(prompt);
    const card = element('article', 'word-card');
    card.append(picture(word), element('h2', 'word-text', word.text));
    const feedback = element('p', 'audio-feedback');
    feedback.setAttribute('role', 'status');
    const actions = element('div', 'card-actions');
    let confirmed = !challenge;
    let busy = false;
    function advance() {
      if (!confirmed || busy || destroyed || finished) return;
      wordIndex++;
      if (wordIndex >= round.words.length) { wordIndex = 0; roundIndex++; }
      if (roundIndex >= rounds.length) {
        finished = true;
        audio.stop();
        onComplete();
      } else render();
    }
    const next = button('다음 →', 'primary', advance);
    next.disabled = !confirmed;
    async function listen(manual = true) {
      if (busy || destroyed) return;
      busy = true;
      sound.disabled = true;
      next.disabled = true;
      const result = await audio.play(word.audio);
      if (destroyed || token !== generation) return;
      busy = false;
      sound.disabled = false;
      if (result === 'played' || result === 'placeholder') {
        if (manual && challenge) confirmed = true;
        feedback.textContent = result === 'placeholder' && manual ? '소리는 곧 만나요.' : '';
        if (challenge && confirmed) {
          sound.textContent = '확인';
          sound.classList.add('confirmed');
        }
      } else if (result === 'failed') {
        feedback.textContent = '소리가 안 들렸어요. 다시 눌러 주세요.';
      }
      next.disabled = !confirmed;
    }
    const sound = button(challenge ? '정답 확인' : '↻ 다시 듣기', challenge ? 'primary' : 'secondary', () => {
      if (challenge && confirmed) advance();
      else listen();
    });
    if (challenge) {
      actions.classList.add('single-action');
      actions.append(sound);
    } else actions.append(sound, next);
    screen.append(toolbar, card, feedback, actions);
    container.replaceChildren(screen);
    prompt.focus({ preventScroll: true });
    if (!challenge) listen(false);
  }
  return {
    start: render,
    destroy() {
      destroyed = true;
      generation++;
      audio.stop();
      container.replaceChildren();
    },
  };
}
