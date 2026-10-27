import { createAbcMemory } from './abc-memory/index.js';
import { createDiceGame } from './dice/index.js';

// Games receive content, their own screen and exit callback, never learning-progress setters.
export const games = [
  { id: 'abc-memory', title: 'ABC 메모리 게임', icon: 'A ↔ 그림', description: '그림과 단어의 짝을 찾아요', create: createAbcMemory },
  { id: 'dice', title: '주사위 게임', icon: '⚄', description: '그림을 맞히고 도착까지 한 칸씩!', create: createDiceGame },
];

export function getGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) throw new Error(`Unknown game: ${id}`);
  return game.create;
}
