export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  // A shuffled round should feel different, even if random yielded the same order.
  if (copy.length > 1 && copy.every((item, i) => item === items[i])) copy.push(copy.shift());
  return copy;
}

export function makeRounds(words, config, random = Math.random) {
  return config.rounds.map(round => ({
    ...round,
    words: round.shuffle ? shuffle(words, random) : [...words],
  }));
}
