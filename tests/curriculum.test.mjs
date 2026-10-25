import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectWords } from '../src/core/curriculum.js';
import { validateData } from '../src/core/validation.js';
import { initialProgress, loadProgress, recordCompletion, STORAGE_KEY } from '../src/core/progress.js';

const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url)));
const data = { config: read('data/config.json'), words: read('data/words.json'), stages: read('data/stages.json') };
function storageFor(value) {
  const map = new Map([[STORAGE_KEY, JSON.stringify(value)]]);
  return { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) };
}

test('104 words form four-word lessons, three new lessons followed by their repeats', () => {
  assert.equal(validateData(data), true);
  assert.equal(data.words.length, 104);
  assert.equal(data.stages.length, 52);
  const occurrences = new Map();
  for (const stage of data.stages) {
    const words = selectWords(data, stage.id);
    assert.equal(words.length, 4);
    words.forEach(word => occurrences.set(word.id, (occurrences.get(word.id) ?? 0) + 1));
    if (stage.kind === 'repeat') assert.deepEqual(words, selectWords(data, stage.repeatOf));
  }
  assert.ok([...occurrences.values()].every(count => count === 2));
  assert.equal(occurrences.size, 104);
  for (let offset = 0; offset < 48; offset += 6) {
    assert.deepEqual(data.stages.slice(offset, offset + 6).map(stage => stage.kind), ['learn', 'learn', 'learn', 'repeat', 'repeat', 'repeat']);
    for (let i = 0; i < 3; i++) assert.equal(data.stages[offset + 3 + i].repeatOf, offset + 1 + i);
  }
  assert.deepEqual(data.stages.slice(-4).map(stage => stage.kind), ['learn', 'learn', 'repeat', 'repeat']);
  for (const word of data.words) for (const key of ['image', 'audio']) assert.ok(fs.existsSync(new URL(`../${word[key]}`, import.meta.url)), word[key]);
});

test('existing stages 1–50 and all history survive migration without advancing', () => {
  for (let id = 1; id <= 50; id++) {
    const history = [{ date: '2026-10-24', stageId: id, wordIds: ['cat', 'dog'] }];
    const old = { schemaVersion: 1, currentStage: id, completedDays: 2, history };
    const storage = storageFor(old);
    const migrated = loadProgress(storage, data.stages);
    assert.equal(migrated.currentStage, id);
    assert.equal(migrated.completedDays, 0);
    assert.deepEqual(migrated.history, history);
    assert.equal(migrated.curriculumVersion, 2);
    assert.deepEqual(loadProgress(storage, data.stages), migrated);
  }
});

test('retired review IDs migrate once, while new stages 51 and 52 retain their identity', () => {
  for (let id = 51; id <= 77; id++) {
    const old = { schemaVersion: 1, currentStage: id, completedDays: 1, history: [] };
    assert.equal(loadProgress(storageFor(old), data.stages).currentStage, Math.min((id - 50) * 2 + 1, 50));
  }
  for (const id of [51, 52]) {
    const current = { ...initialProgress(data.stages), currentStage: id };
    assert.equal(loadProgress(storageFor(current), data.stages).currentStage, id);
  }
});

test('one completion advances one stage; previews and same-day repeats never advance', () => {
  assert.equal(data.config.completionDays, 1);
  let progress = initialProgress(data.stages);
  const first = { stageId: 1, date: '2026-10-25', wordIds: data.stages[0].wordIds };
  assert.deepEqual(recordCompletion(progress, { ...first, stageId: 2 }, data.stages, 1), progress);
  progress = recordCompletion(progress, first, data.stages, 1);
  assert.equal(progress.currentStage, 2);
  assert.deepEqual(recordCompletion(progress, { ...first, stageId: 2 }, data.stages, 1), progress);
  progress = recordCompletion(progress, { stageId: 2, date: '2026-10-26', wordIds: data.stages[1].wordIds }, data.stages, 1);
  assert.equal(progress.currentStage, 3);
  assert.equal(progress.history.length, 2);
});
