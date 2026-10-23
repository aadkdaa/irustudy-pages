import { element, button } from '../../ui/elements.js';

export function createAbcMemory({ container, onExit }) {
  return {
    start() {
      const screen = element('section', 'game-screen screen');
      const badge = element('div', 'game-badge', 'ABC');
      badge.setAttribute('aria-hidden', 'true');
      const title = element('h1', 'result-title', 'ABC 메모리 게임');
      title.tabIndex = -1;
      screen.append(badge, element('p', 'eyebrow', 'LITTLE PLAY TIME'), title,
        element('p', 'game-description', '알파벳과 함께하는 메모리 게임을 준비하고 있어요.'),
        element('p', 'game-status', '곧 만나요'),
        button('처음으로', 'secondary', onExit));
      container.replaceChildren(screen);
      title.focus({ preventScroll: true });
    },
    destroy() { container.replaceChildren(); },
  };
}
