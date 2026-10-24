export function learnedWords(words, history) {
  const learned = new Set(history.flatMap(entry => Array.isArray(entry.wordIds) ? entry.wordIds : []));
  return words.filter(word => learned.has(word.id));
}
