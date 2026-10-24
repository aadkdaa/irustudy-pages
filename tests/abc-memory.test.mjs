import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDeck } from '../src/games/abc-memory/plan.js';
import { createAbcMemory } from '../src/games/abc-memory/index.js';
import { learnedWords } from '../src/games/content.js';

const words = ['cat', 'dog', 'pig', 'duck', 'bear', 'fish'].map(id => ({
  id, text: id, image: `assets/images/${id}.webp`, audio: `assets/audio/${id}.mp3`,
}));

test('deck has six distinct picture/word pairs', () => {
  const deck = makeDeck([...words, words[0]], () => 0.4);
  assert.equal(deck.length, 12);
  for (const word of words) assert.deepEqual(deck.filter(c => c.word.id === word.id).map(c => c.type).sort(), ['picture', 'word']);
  assert.deepEqual(makeDeck([]), []);
});

test('only completed word IDs are eligible; a small learned pool still makes twelve cards', () => {
  const history = [{ wordIds: ['cat', 'dog', 'pig', 'duck'] }, { wordIds: ['cat', 'unknown'] }, {}];
  const pool = learnedWords(words, history);
  assert.deepEqual(pool.map(word => word.id), ['cat', 'dog', 'pig', 'duck']);
  assert.deepEqual(learnedWords(words, []), []);
  const deck = makeDeck(pool);
  assert.equal(deck.length, 12);
  assert.ok(deck.every(card => pool.includes(card.word)));
  for (const word of pool) {
    const copies = deck.filter(card => card.word.id === word.id);
    assert.equal(copies.filter(card => card.type === 'picture').length, copies.filter(card => card.type === 'word').length);
  }
});

class Node {
  constructor(tag) {
    Object.assign(this, { tag, children: [], className: '', dataset: {}, attrs: {}, events: {}, textContent: '' });
    this.classList = {
      add: name => this.classList.toggle(name, true),
      toggle: (name, enabled) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        if (enabled) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
      },
    };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(name, fn) { this.events[name] = fn; }
  click() { if (!this.disabled) this.events.click?.(); }
  focus() {}
  querySelector(tag) { return find(this, node => node !== this && node.tag === tag); }
}
function find(node, predicate) { return predicate(node) ? node : node.children.map(child => find(child, predicate)).find(Boolean); }
function byClass(node, name) { return find(node, item => item.className.split(' ').includes(name)); }
const tick = () => new Promise(resolve => setImmediate(resolve));

test('repeated words still require one picture and one word, never two identical card types', async () => {
  const oldDocument = globalThis.document, oldImage = globalThis.Image;
  globalThis.document = { baseURI: 'http://localhost/', createElement: tag => new Node(tag), addEventListener() {}, removeEventListener() {} };
  globalThis.Image = class extends Node { constructor() { super('img'); } };
  const container = new Node('main');
  const game = createAbcMemory({ container, words: [words[0]], audio: { play: async () => 'played', stop() {} }, onExit() {} });
  try {
    game.start();
    const cards = byClass(container, 'memory-board').children;
    const pictures = cards.filter(card => byClass(card, 'memory-type-picture'));
    pictures[0].click(); await tick();
    pictures[1].click(); await tick();
    await new Promise(resolve => setTimeout(resolve, 180));
    assert.equal(byClass(container, 'memory-counter').textContent, '0 / 6쌍');
    assert.ok(cards.every(card => !card.disabled));
    pictures[0].click(); await tick();
    cards.find(card => byClass(card, 'memory-type-word')).click(); await tick();
    assert.equal(byClass(container, 'memory-counter').textContent, '1 / 6쌍');
  } finally {
    game.destroy(); globalThis.document = oldDocument; globalThis.Image = oldImage;
  }
});

test('audio gates turns, mismatches close, matches stay, completion and cleanup are safe', async () => {
  const oldDocument = globalThis.document, oldImage = globalThis.Image;
  globalThis.document = { baseURI: 'http://localhost/', createElement: tag => new Node(tag), addEventListener() {}, removeEventListener() {} };
  globalThis.Image = class extends Node { constructor() { super('img'); } };
  let pending, plays = 0;
  const audio = { play() { plays++; return new Promise(resolve => { pending = resolve; }); }, stop() { pending?.('cancelled'); pending = null; } };
  const container = new Node('main');
  const game = createAbcMemory({ container, words, audio, onExit() {} });
  const completeAudio = async result => { const resolve = pending; pending = null; resolve(result); await tick(); };
  const key = card => find(card, node => node.tag === 'img')?.alt ?? byClass(card, 'memory-word').textContent;
  try {
    game.start();
    let cards = byClass(container, 'memory-board').children;
    const first = cards[0], wrong = cards.find(card => key(card) !== key(first));
    first.click(); wrong.click();
    assert.equal(plays, 1);
    assert.ok(cards.every(card => card.disabled));
    await completeAudio('played');
    wrong.click();
    await completeAudio('played');
    assert.ok(cards.every(card => card.disabled));
    await new Promise(resolve => setTimeout(resolve, 180));
    assert.ok(cards.every(card => !card.disabled && !card.className.includes('is-open')));
    first.click();
    await completeAudio('failed');
    assert.ok(cards.every(card => card.disabled));
    assert.equal(byClass(container, 'memory-retry').hidden, false);
    byClass(container, 'memory-retry').click();
    await completeAudio('played');
    const partner = cards.find(card => card !== first && key(card) === key(first));
    partner.click(); await completeAudio('played');
    assert.ok(first.className.includes('is-matched') && partner.className.includes('is-matched'));
    assert.ok(first.disabled && partner.disabled);
    assert.equal(byClass(container, 'memory-counter').textContent, '1 / 6쌍');
    for (const word of words.filter(word => word.id !== key(first))) {
      for (const card of cards.filter(card => key(card) === word.id)) { card.click(); await completeAudio('played'); }
    }
    assert.equal(byClass(container, 'memory-counter').textContent, '6 / 6쌍');
    assert.equal(byClass(container, 'memory-finish').hidden, false);
    assert.ok(cards.every(card => card.disabled && card.className.includes('is-matched')));
    byClass(container, 'memory-finish').querySelector('button').click();
    assert.equal(byClass(container, 'memory-counter').textContent, '0 / 6쌍');
    cards = byClass(container, 'memory-board').children;
    cards[0].click(); await completeAudio('cancelled');
    assert.equal(byClass(container, 'memory-retry').hidden, false);
    byClass(container, 'memory-retry').click();
    game.destroy(); await tick();
    assert.equal(container.children.length, 0);
  } finally {
    game.destroy();
    globalThis.document = oldDocument;
    globalThis.Image = oldImage;
  }
});
