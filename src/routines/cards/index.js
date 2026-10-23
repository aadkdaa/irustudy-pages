import { makeRounds } from './plan.js';
import { introduceWord } from './intro.js';
import { element, button, picture } from '../../ui/elements.js';

export function createCardRoutine({ container, words, config, audio, onComplete }) {
  const rounds = makeRounds(words, config);
  let roundIndex = 0;
  let wordIndex = 0;
  let destroyed = false;
  let generation = 0;
  let finished = false;
  let intro;

  function render() {
    intro?.cancel();
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
    const illustration = element('div', 'card-picture-area');
    illustration.append(picture(word));
    const spelling = element('div', 'card-word-area');
    const wordText = element('h2', 'word-text', word.text);
    if (word.text.length > 7) wordText.classList.add('long-word');
    wordText.lang = 'en';
    spelling.append(wordText);
    card.append(illustration, spelling);
    if (round.showMeaning) {
      const meaning = element('div', 'card-meaning-area');
      meaning.append(element('p', 'word-meaning', word.meaningKo));
      illustration.append(meaning);
    }
    const feedback = element('p', 'audio-feedback');
    feedback.setAttribute('role', 'status');
    const actions = element('div', 'card-actions');
    let confirmed = !challenge;
    let busy = true;
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
          advance();
          return;
        }
      } else if (result === 'failed') {
        feedback.textContent = '소리가 안 들렸어요. 다시 눌러 주세요.';
      }
      next.disabled = !confirmed;
    }
    const sound = button(challenge ? '정답 확인' : '↻ 다시 듣기', challenge ? 'primary' : 'secondary', () => listen());
    if (challenge) {
      actions.classList.add('single-action');
      actions.append(sound);
    } else actions.append(sound, next);
    screen.append(toolbar, card, feedback, actions);
    container.replaceChildren(screen);
    prompt.focus({ preventScroll: true });
    sound.disabled = true;
    next.disabled = true;
    intro = introduceWord(screen, wordText, config.wordIntro);
    intro.finished.then(ready => {
      if (destroyed || token !== generation) return;
      busy = false;
      sound.disabled = false;
      next.disabled = !confirmed;
      if (ready && !challenge) listen(false);
    });
  }
  return {
    start: render,
    destroy() {
      destroyed = true;
      generation++;
      intro?.cancel();
      audio.stop();
      container.replaceChildren();
    },
  };
}
