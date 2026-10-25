export function validateData({ config, words, stages }) {
  const fail = message => { throw new Error(message); };
  const positive = value => Number.isInteger(value) && value > 0;
  if (config.schemaVersion !== 2) fail('Unsupported schema version');
  if (!/^[a-z][a-z0-9-]*$/.test(config.activeRoutine)) fail('Invalid routine ID');
  if (!positive(config.completionDays)) fail('Invalid completionDays');
  new Intl.DateTimeFormat('en', { timeZone: config.timeZone }).format();
  if (!Array.isArray(words) || !words.length || !Array.isArray(stages) || !stages.length) fail('Empty content');
  const wordIds = new Set();
  for (const word of words) {
    if (!word.id || wordIds.has(word.id) || typeof word.text !== 'string' || !word.text.trim()) fail('Invalid or duplicate word');
    wordIds.add(word.id);
    if (typeof word.meaningKo !== 'string' || !word.meaningKo.trim()) fail('Missing Korean meaning');
    for (const type of ['image', 'audio']) {
      const folder = type === 'image' ? 'images' : 'audio';
      if (word[type] !== null && (typeof word[type] !== 'string' ||
        !word[type].startsWith(`assets/${folder}/`) || word[type].includes('..'))) fail(`Invalid ${type} path`);
    }
  }
  const stageIds = new Set();
  const introduced = new Set();
  for (const [index, stage] of stages.entries()) {
    if (!positive(stage.id) || stageIds.has(stage.id)) fail('Invalid or duplicate stage');
    stageIds.add(stage.id);
    if (!Array.isArray(stage.wordIds) || stage.wordIds.length !== 4) fail('Each stage requires four words');
    const all = stage.wordIds;
    if (new Set(all).size !== all.length || all.some(id => !wordIds.has(id))) fail('Duplicate or unknown word reference');
    if (stage.kind === 'repeat') {
      const source = stages.slice(0, index).find(item => item.id === stage.repeatOf && item.kind === 'learn');
      if (!source || all.some((id, i) => id !== source.wordIds[i])) fail('Repeat must match an earlier learning stage');
    } else if (stage.kind === 'learn') {
      if (all.some(id => introduced.has(id))) fail('Learning stage must contain only new words');
      all.forEach(id => introduced.add(id));
    } else fail('Invalid stage kind');
  }
  return true;
}
