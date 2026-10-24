function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makeDeck(words, random = Math.random) {
  const unique = [...new Map(words.filter(word => word.image && word.audio).map(word => [word.id, word])).values()];
  if (!unique.length) return [];
  const chosen = shuffle(unique, random).slice(0, 6);
  // Keep twelve cards even after the first four-word lesson, using learned words only.
  const pairs = Array.from({ length: 6 }, (_, index) => chosen[index % chosen.length]);
  return shuffle(pairs.flatMap(word => [
    { word, type: 'picture', open: false, matched: false },
    { word, type: 'word', open: false, matched: false },
  ]), random);
}
