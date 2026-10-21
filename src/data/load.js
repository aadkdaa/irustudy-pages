import { validateData } from '../core/validation.js';
import { validateRoutine } from '../routines/registry.js';

export async function loadData() {
  const root = new URL('../../', import.meta.url);
  async function json(path) {
    const response = await fetch(new URL(path, root), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Cannot load ${path}`);
    return response.json();
  }
  const [config, words, stages] = await Promise.all([
    json('data/config.json'), json('data/words.json'), json('data/stages.json'),
  ]);
  if (!/^[a-z][a-z0-9-]*$/.test(config.activeRoutine)) throw new Error('Invalid routine ID');
  const routine = await json(`data/routines/${config.activeRoutine}.json`);
  const data = { config, words, stages, routine };
  validateData(data);
  validateRoutine(config.activeRoutine, routine);
  return data;
}
