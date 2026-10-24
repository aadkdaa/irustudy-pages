import { element, button, picture } from '../../ui/elements.js';
import { createAudioPlayer } from '../../media/audio.js';
import { makeDeck } from './plan.js';
import { fitViewport } from '../../ui/viewport.js';

export function createAbcMemory({ container, words, onExit, audio = createAudioPlayer() }) {
  if (typeof ResizeObserver !== 'undefined') fitViewport(container);
  let cards, selected, pairs, busy, destroyed = false, generation = 0, timer;
  let status, counter, retry, finish;

  function lockCards() {
    for (const card of cards) card.node.disabled = busy || card.open || card.matched;
  }
  function show(card, open) {
    card.open = open;
    card.node.classList.toggle('is-open', open);
    card.node.setAttribute('aria-label', open
      ? `${card.word.text} ${card.type === 'picture' ? '그림' : '단어'}${card.matched ? ', 짝 맞춤' : ''}`
      : `${cards.indexOf(card) + 1}번 카드 뒤집기`);
  }
  function settlePair() {
    retry.hidden = true;
    if (selected.length === 1) {
      busy = false;
      status.textContent = '같은 단어의 짝을 찾아 주세요.';
      lockCards();
      return;
    }
    const [first, second] = selected;
    if (first.word.id === second.word.id && first.type !== second.type) {
      for (const card of selected) {
        card.matched = true;
        card.node.classList.add('is-matched');
        show(card, true);
      }
      selected = [];
      pairs++;
      counter.textContent = `${pairs} / 6쌍`;
      busy = false;
      status.textContent = pairs === 6 ? '여섯 쌍을 모두 찾았어요!' : '짝을 찾았어요! 다음 짝도 찾아볼까요?';
      lockCards();
      if (pairs === 6) {
        finish.hidden = false;
        finish.querySelector('h2').focus({ preventScroll: true });
      }
    } else {
      status.textContent = '다른 짝이에요. 위치를 기억해 주세요!';
      timer = setTimeout(() => {
        if (destroyed) return;
        selected.forEach(card => show(card, false));
        selected = [];
        busy = false;
        status.textContent = '카드를 뒤집어 다시 찾아볼까요?';
        lockCards();
      }, 120);
    }
  }
  async function speak(card) {
    const token = generation;
    retry.hidden = true;
    status.textContent = '단어를 듣고 있어요…';
    let outcome;
    try { outcome = await audio.play(card.word.audio); } catch { outcome = 'failed'; }
    if (destroyed || token !== generation) return;
    if (outcome !== 'played') {
      status.textContent = '소리를 끝까지 듣지 못했어요. 다시 듣기를 눌러 주세요.';
      retry.hidden = false;
      return;
    }
    settlePair();
  }
  function flip(card) {
    if (destroyed || busy || card.open || card.matched) return;
    busy = true;
    selected.push(card);
    show(card, true);
    lockCards();
    speak(card);
  }
  function onVisibility() { if (document.hidden) audio.stop(); }
  function start() {
    generation++;
    clearTimeout(timer);
    audio.stop();
    selected = [];
    pairs = 0;
    busy = false;
    cards = makeDeck(words);
    if (!cards.length) {
      const screen = element('section', 'game-screen screen');
      const title = element('h1', 'memory-title', '먼저 단어를 배워 볼까요?');
      title.tabIndex = -1;
      screen.append(title, element('p', 'game-description', '학습을 완료하면 배운 단어로 짝 맞추기를 할 수 있어요.'), button('처음으로', 'secondary', onExit));
      container.replaceChildren(screen);
      title.focus({ preventScroll: true });
      return;
    }
    const screen = element('section', 'memory-screen screen');
    const heading = element('div', 'memory-heading');
    const title = element('h1', 'memory-title', 'ABC 메모리 게임');
    title.tabIndex = -1;
    counter = element('span', 'memory-counter', '0 / 6쌍');
    heading.append(title, counter);
    screen.append(element('p', 'eyebrow', 'PICTURE & WORD'), heading,
      element('p', 'memory-instructions', '그림과 같은 뜻의 단어를 찾아요. 소리가 끝나면 다음 카드를 뒤집어요.'));
    const board = element('div', 'memory-board');
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', '그림과 단어 카드 12장');
    for (const card of cards) {
      const node = element('button', 'memory-card');
      node.type = 'button';
      const inner = element('span', 'memory-card-inner');
      inner.setAttribute('aria-hidden', 'true');
      const back = element('span', 'memory-back', '✦');
      const face = element('span', `memory-face memory-type-${card.type}`);
      if (card.type === 'picture') face.append(picture(card.word));
      else {
        const text = element('span', 'memory-word', card.word.text);
        text.lang = 'en';
        face.append(text);
      }
      inner.append(back, face);
      node.append(inner);
      card.node = node;
      show(card, false);
      node.addEventListener('click', () => flip(card));
      board.append(node);
    }
    status = element('p', 'memory-status', '카드 하나를 뒤집어 볼까요?');
    status.setAttribute('role', 'status');
    retry = button('↻ 다시 듣기', 'secondary memory-retry', () => {
      if (!retry.hidden && selected.length) speak(selected.at(-1));
    });
    retry.hidden = true;
    finish = element('section', 'memory-finish');
    finish.hidden = true;
    const finishTitle = element('h2', '', '모두 맞췄어요!');
    finishTitle.tabIndex = -1;
    finish.append(finishTitle, element('p', '', '그림과 단어가 모두 짝을 찾았어요.'), button('한 번 더', 'primary', start));
    screen.append(board, status, retry, finish, button('처음으로', 'secondary memory-exit', onExit));
    container.replaceChildren(screen);
    title.focus({ preventScroll: true });
    document.addEventListener('visibilitychange', onVisibility);
  }
  return {
    start,
    destroy() {
      destroyed = true;
      generation++;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      audio.stop();
      container.replaceChildren();
    },
  };
}
