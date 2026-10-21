export function validateCardConfig(config) {
  if (config.schemaVersion !== 1) throw new Error('Unsupported card schema');
  if (config.wordIntro) {
    const intro = config.wordIntro;
    if (intro.revealMs !== undefined && (!Number.isInteger(intro.revealMs) || intro.revealMs < 0 || intro.revealMs > 3000)) throw new Error('Invalid reveal duration');
    if (typeof intro.enabled !== 'boolean' || !Number.isFinite(intro.scale) || intro.scale < 1 || intro.scale > 3 ||
      !Number.isInteger(intro.holdMs) || intro.holdMs < 0 || intro.holdMs > 3000 ||
      !Number.isInteger(intro.moveMs) || intro.moveMs < 1 || intro.moveMs > 3000) throw new Error('Invalid word intro');
  }
  if (!Array.isArray(config.rounds) || !config.rounds.length) throw new Error('Missing rounds');
  for (const round of config.rounds) {
    if (round.showMeaning !== undefined && typeof round.showMeaning !== 'boolean') throw new Error('Invalid meaning visibility');
    if (!['learn', 'challenge'].includes(round.mode) || typeof round.shuffle !== 'boolean' ||
      typeof round.prompt !== 'string') throw new Error('Invalid card round');
  }
}
