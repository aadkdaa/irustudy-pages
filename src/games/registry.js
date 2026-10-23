import { createAbcMemory } from './abc-memory/index.js';

// Games receive their own screen and exit callback, never learning-progress setters.
export const games = [
  { id: 'abc-memory', title: 'ABC 메모리 게임', create: createAbcMemory },
];

export function getGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) throw new Error(`Unknown game: ${id}`);
  return game.create;
}
