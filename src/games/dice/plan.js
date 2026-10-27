export const rules = { spaces: 30, sides: 6, choices: 3 };

export function rollDice(random = Math.random) {
  return Math.floor(random() * rules.sides) + 1;
}

export function destination(position, roll) {
  return Math.min(rules.spaces, position + roll);
}

export function makeQuestion(words, random = Math.random) {
  const unique = [...new Map(words.map(word => [word.id, word])).values()];
  if (unique.length < rules.choices) throw new Error('At least three words are required');
  const answer = unique[Math.floor(random() * unique.length)];
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  const others = shuffle(unique.filter(word => word.id !== answer.id)).slice(0, rules.choices - 1);
  return { answer, choices: shuffle([answer, ...others]) };
}
