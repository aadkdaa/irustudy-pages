import { element, button } from '../ui/elements.js';
import { games } from './registry.js';

export function createGameMenu(onSelect) {
  const section = element('section', 'game-menu');
  section.setAttribute('aria-label', '학습 게임');
  section.append(element('p', 'game-menu-caption', '오늘 공부 끝! 이제 놀아 볼까?'));
  const list = element('div', 'game-list');
  for (const game of games) {
    list.append(button(game.title, 'game-button', () => onSelect(game.id)));
  }
  section.append(list);
  return section;
}
