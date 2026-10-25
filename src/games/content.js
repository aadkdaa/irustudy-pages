import { dateKey } from '../core/progress.js';

export function learnedWords(words, history) {
  const learned = new Set(history.flatMap(entry => Array.isArray(entry.wordIds) ? entry.wordIds : []));
  return words.filter(word => learned.has(word.id));
}


export function todayStageWords(data, history, now = new Date()) {
  const today = dateKey(now, data.config.timeZone);
  const completed = history.find(entry => entry.date === today);
  const stage = data.stages.find(stage => stage.id === completed?.stageId);
  return (stage?.wordIds ?? []).map(id => data.words.find(word => word.id === id)).filter(Boolean);
}
