import test from 'node:test';
import assert from 'node:assert/strict';
import { rollDice, destination, makeQuestion } from '../src/games/dice/plan.js';
import { createDiceGame } from '../src/games/dice/index.js';
import { wordsThroughTodayStage } from '../src/games/content.js';

const words = ['cat', 'dog', 'pig', 'duck'].map(id => ({ id, text: id, audio: `${id}.mp3`, image: null }));
test('dice range, finish overshoot, and three distinct choices from today’s words', () => {
  assert.equal(rollDice(() => 0), 1);
  assert.equal(rollDice(() => .999), 6);
  assert.equal(destination(28, 6), 30);
  for (let i = 0; i < 100; i++) {
    const question = makeQuestion(words, Math.random);
    assert.equal(new Set(question.choices.map(w => w.id)).size, 3);
    assert.ok(question.choices.includes(question.answer));
    assert.ok(question.choices.every(w => words.includes(w)));
  }
  assert.throws(() => makeQuestion([words[0], words[0], words[1]]));
  // Every word can be the answer; all other words remain eligible as distractors.
  for (let i = 0; i < words.length; i++) {
    const question = makeQuestion(words, () => (i + .1) / words.length);
    assert.equal(question.answer, words[i]);
    assert.equal(question.choices.filter(word => word === question.answer).length, 1);
  }
});

test('cumulative pool stops at today’s completed stage, deduplicates repeats and ignores future lessons', () => {
  const data = { words, config: { timeZone: 'Asia/Seoul' }, stages: [
    { id: 1, wordIds: ['cat'] }, { id: 2, wordIds: ['dog', 'pig'] },
    { id: 3, wordIds: ['cat'] }, { id: 4, wordIds: ['duck'] },
  ] };
  const now = new Date('2026-10-25T03:00:00Z');
  // Earlier history may be absent after a saved-stage migration or manual stage selection.
  const history = [{ date: '2026-10-25', stageId: 3 }];
  assert.deepEqual(wordsThroughTodayStage(data, history, now).map(w => w.id), ['cat', 'dog', 'pig']);
  assert.deepEqual(wordsThroughTodayStage(data, history, new Date('2026-10-25T15:00:00Z')), []);
  assert.deepEqual(wordsThroughTodayStage(data, [{ date: '2026-10-25', stageId: 99 }], now), []);
});

class Node {
  constructor(tag) {
    Object.assign(this, { tag, children: [], className: '', dataset: {}, style: {}, attrs: {}, events: {}, textContent: '' });
    this.classList = {
      add: name => this.classList.toggle(name, true),
      remove: name => this.classList.toggle(name, false),
      toggle: (name, enabled) => {
        const set = new Set(this.className.split(' ').filter(Boolean));
        if (enabled) set.add(name); else set.delete(name);
        this.className = [...set].join(' ');
      },
    };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(key, value) { this.events[key] = value; }
  click() { if (!this.disabled) this.events.click?.(); }
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  animate(frames, options) {
    (this.animations ??= []).push({ frames, options });
    return { cancel() {}, onfinish: null };
  }
  querySelectorAll(tag) { return this.children.flatMap(n => [...(n.tag === tag ? [n] : []), ...n.querySelectorAll(tag)]); }
}
function find(node, name) { return node.className.split(' ').includes(name) ? node : node.children.map(n => find(n, name)).find(Boolean); }
const tick = () => new Promise(resolve => setImmediate(resolve));

test('audio gating, wrong answers, single movement, win, replay and cancellation', async () => {
  const oldDocument = globalThis.document;
  globalThis.document = { createElement: tag => new Node(tag), addEventListener() {}, removeEventListener() {} };
  const oldSet = globalThis.setTimeout, oldClear = globalThis.clearTimeout;
  const timers = new Map(); let timerId = 0, pending, lastPath, wins = 0;
  globalThis.setTimeout = fn => { timers.set(++timerId, fn); return timerId; };
  globalThis.clearTimeout = id => timers.delete(id);
  function advance() { const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); }
  function finishRoll() { while (timers.size) advance(); }
  const audio = {
    play(path) {
      lastPath = path;
      if (path.endsWith('success.wav')) { wins++; return Promise.resolve('played'); }
      return new Promise(resolve => { pending = resolve; });
    },
    stop() { pending?.('cancelled'); pending = undefined; },
  };
  const container = new Node('main');
  const game = createDiceGame({ container, words, audio, random: () => .999, onExit() {} });
  const roll = () => find(container, 'dice-controls').children[1];
  const counter = () => find(container, 'dice-counter').textContent;
  const choices = () => find(container, 'dice-choices').children;
  function correct() {
    const answer = lastPath.replace('.mp3', '');
    return choices().find(c => c.attrs['aria-label'].endsWith(answer));
  }
  try {
    game.start(); roll().click(); roll().click();
    assert.equal(find(container, 'dice-face').animations.length, 1);
    assert.equal(timers.size, 1);
    finishRoll();
    assert.equal(find(container, 'dice-quiz').open, true);
    assert.ok(choices().every(c => c.disabled));
    assert.equal(counter(), '0 / 30칸');
    pending('failed'); await tick();
    assert.ok(choices().every(c => c.disabled));
    find(container, 'dice-listen').click(); pending('played'); await tick();
    choices().find(c => c !== correct()).click();
    finishRoll();
    assert.equal(find(container, 'dice-quiz').open, false);
    assert.equal(counter(), '0 / 30칸');
    assert.equal(roll().disabled, false);
    for (let i = 1; i <= 5; i++) {
      roll().click(); finishRoll(); pending('played'); await tick();
      const choice = correct(); choice.click(); choice.click();
      assert.equal(timers.size, 1);
      assert.equal(find(container, 'dice-quiz').open, true);
      assert.equal(counter(), `${(i - 1) * 6} / 30칸`);
      advance(); // Close the popup without moving the pawn.
      assert.equal(find(container, 'dice-quiz').open, false);
      assert.equal(counter(), `${(i - 1) * 6} / 30칸`);
      advance(); // Only the separate board-visible delay may start movement.
      assert.equal(counter(), `${(i - 1) * 6 + 1} / 30칸`);
      assert.ok(find(container, 'dice-pawn').animations.length > 0);
      while (timers.size) advance();
      assert.equal(counter(), `${i * 6} / 30칸`);
    }
    assert.equal(wins, 1);
    assert.equal(roll().hidden, true);
    find(container, 'dice-panel').querySelectorAll('button')[0].click();
    assert.equal(counter(), '0 / 30칸');
    roll().click(); finishRoll();
    find(container, 'dice-quiz-close').click(); await tick();
    assert.equal(find(container, 'dice-quiz').open, false);
    assert.equal(counter(), '0 / 30칸');
    assert.equal(roll().disabled, false);
    roll().click(); finishRoll();
    game.destroy(); await tick();
    assert.equal(container.children.length, 0);
    assert.equal(timers.size, 0);
    assert.equal(wins, 1);
  } finally {
    game.destroy();
    globalThis.document = oldDocument;
    globalThis.setTimeout = oldSet; globalThis.clearTimeout = oldClear;
  }
});
