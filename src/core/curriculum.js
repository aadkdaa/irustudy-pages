export function selectWords(data, stageId) {
  const stage = data.stages.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown stage: ${stageId}`);
  const counts = stage === data.stages[0] ? data.config.learning.firstStage : data.config.learning.default;
  const ids = [
    ...stage.newCandidates.slice(0, counts.newWordCount),
    ...stage.reviewCandidates.slice(0, counts.reviewWordCount),
  ];
  return ids.map(id => data.words.find(word => word.id === id));
}
