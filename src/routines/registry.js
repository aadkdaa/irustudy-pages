import { createCardRoutine } from './cards/index.js';
import { validateCardConfig } from './cards/config.js';

const routines = { cards: { create: createCardRoutine, validate: validateCardConfig } };
export function getRoutine(id) {
  if (!routines[id]) throw new Error(`Unknown routine: ${id}`);
  return routines[id].create;
}
export function validateRoutine(id, config) {
  if (!routines[id]) throw new Error(`Unknown routine: ${id}`);
  routines[id].validate(config);
}
