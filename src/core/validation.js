export function validateData({ config, words, stages }) {
  const fail = message => { throw new Error(message); };
  const positive = value => Number.isInteger(value) && value > 0;
  if (config.schemaVersion !== 1) fail('Unsupported schema version');
  if (!/^[a-z][a-z0-9-]*$/.test(config.activeRoutine)) fail('Invalid routine ID');
  if (!positive(config.completionDays)) fail('Invalid completionDays');
  new Intl.DateTimeFormat('en', { timeZone: config.timeZone }).format();
  if (!Array.isArray(words) || !words.length || !Array.isArray(stages) || !stages.length) fail('Empty content');
  const wordIds = new Set();
  for (const word of words) {
    if (!word.id || wordIds.has(word.id) || typeof word.text !== 'string' || !word.text.trim()) fail('Invalid or duplicate word');
    wordIds.add(word.id);
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
    if (!Array.isArray(stage.newCandidates) || !Array.isArray(stage.reviewCandidates)) fail('Missing candidates');
    const all = [...stage.newCandidates, ...stage.reviewCandidates];
    if (new Set(all).size !== all.length || all.some(id => !wordIds.has(id))) fail('Duplicate or unknown word reference');
    const count = index === 0 ? config.learning.firstStage : config.learning.default;
    if (!positive(count.newWordCount) || !Number.isInteger(count.reviewWordCount) || count.reviewWordCount < 0) fail('Invalid word counts');
    if (stage.newCandidates.length < count.newWordCount || stage.reviewCandidates.length < count.reviewWordCount) fail(`Insufficient candidates in stage ${stage.id}`);
    if (stage.reviewCandidates.slice(0, count.reviewWordCount).some(id => !introduced.has(id))) fail('Review word was not previously selected');
    stage.newCandidates.slice(0, count.newWordCount).forEach(id => introduced.add(id));
  }
  return true;
}
