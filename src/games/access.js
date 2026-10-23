import { dateKey } from '../core/progress.js';

export function canPlayGames(progress, timeZone, now = new Date()) {
  const today = dateKey(now, timeZone);
  return progress.history.some(item => item.date === today);
}
