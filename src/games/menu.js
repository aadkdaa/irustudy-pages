import { element, button } from '../ui/elements.js';
import { games } from './registry.js';

export function createGameMenu(onSelect, onExit) {
  const section = element('section', 'game-menu screen');
  section.setAttribute('aria-label', '게임');
  section.append(element('p', 'eyebrow', 'TIME TO PLAY'), element('h1', 'game-menu-title', '게임'), element('p', 'game-menu-caption', '오늘 공부 끝! 이제 놀아 볼까?'));
  const list = element('div', 'game-list');
  for (const game of games) {
    const card = button('', 'game-choice', () => onSelect(game.id));
    const icon = element('span', 'game-choice-icon', 'A ↔ 그림');
    icon.setAttribute('aria-hidden', 'true');
    card.append(icon, element('strong', 'game-choice-title', game.title), element('span', 'game-choice-description', '그림과 단어의 짝을 찾아요'));
    list.append(card);
  }
  section.append(list, button('처음으로', 'secondary', onExit));
  return section;
}
