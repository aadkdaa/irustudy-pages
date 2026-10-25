export function stageLabel(stage) {
  return stage.label ?? `${stage.id}단계`;
}

export function selectWords(data, stageId) {
  const stage = data.stages.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown stage: ${stageId}`);
  return stage.wordIds.map(id => data.words.find(word => word.id === id));
}
