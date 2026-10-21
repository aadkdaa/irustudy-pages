export function stageCounts(config, stage, index) {
  return stage.kind === 'review' ? config.learning.review : index === 0 ? config.learning.firstStage : config.learning.default;
}

export function stageLabel(stage) {
  return stage.label ?? `${stage.id}단계`;
}

export function selectWords(data, stageId) {
  const stage = data.stages.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown stage: ${stageId}`);
  const counts = stageCounts(data.config, stage, data.stages.indexOf(stage));
  const ids = [
    ...stage.newCandidates.slice(0, counts.newWordCount),
    ...stage.reviewCandidates.slice(0, counts.reviewWordCount),
  ];
  return ids.map(id => data.words.find(word => word.id === id));
}
