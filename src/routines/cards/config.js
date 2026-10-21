export function validateCardConfig(config) {
  if (config.schemaVersion !== 1) throw new Error('Unsupported card schema');
  if (!Array.isArray(config.rounds) || !config.rounds.length) throw new Error('Missing rounds');
  for (const round of config.rounds) {
    if (!['learn', 'challenge'].includes(round.mode) || typeof round.shuffle !== 'boolean' ||
      typeof round.prompt !== 'string') throw new Error('Invalid card round');
  }
}
