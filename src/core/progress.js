export const STORAGE_KEY = 'irustudy.progress.v1';

export function dateKey(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
}

export function initialProgress(stages) {
  return { schemaVersion: 1, currentStage: stages[0].id, completedDays: 0, history: [] };
}

export function loadProgress(storage, stages) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return initialProgress(stages);
  const value = JSON.parse(raw);
  if (value.schemaVersion !== 1 || !stages.some(stage => stage.id === value.currentStage) ||
    !Number.isInteger(value.completedDays) || value.completedDays < 0 || !Array.isArray(value.history) ||
    value.history.some(item => !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !Number.isInteger(item.stageId))) {
    throw new Error('Saved progress requires review');
  }
  return value;
}

export function recordCompletion(progress, { stageId, date, wordIds }, stages, requiredDays) {
  if (progress.currentStage !== stageId || progress.history.some(item => item.date === date)) return progress;
  const next = structuredClone(progress);
  next.history.push({ date, stageId, wordIds: [...wordIds] });
  next.completedDays = Math.min(requiredDays, next.completedDays + 1);
  if (next.completedDays >= requiredDays) {
    const index = stages.findIndex(stage => stage.id === stageId);
    if (index < stages.length - 1) {
      next.currentStage = stages[index + 1].id;
      next.completedDays = 0;
    }
  }
  return next;
}

export function changeStage(progress, stageId, stages) {
  if (!stages.some(stage => stage.id === stageId)) throw new Error('Unknown stage');
  return stageId === progress.currentStage ? progress : { ...progress, currentStage: stageId, completedDays: 0 };
}
