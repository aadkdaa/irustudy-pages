export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(text, className, handler) {
  const node = element('button', `button ${className}`, text);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

export function picture(word, small = false) {
  const box = element('div', `word-picture ${small ? 'small' : ''}`);
  const tones = ['peach', 'lavender', 'rose', 'butter', 'mint'];
  box.dataset.tone = tones.includes(word.color) ? word.color : 'lavender';
  function placeholder() {
    box.replaceChildren();
    const shape = element('span', 'picture-placeholder');
    shape.setAttribute('aria-hidden', 'true');
    box.append(shape);
    if (!small) box.append(element('span', 'placeholder-label', '그림 준비 중'));
  }
  if (word.image) {
    const img = new Image();
    img.alt = word.text;
    img.src = new URL(word.image, document.baseURI).href;
    img.onerror = placeholder;
    box.append(img);
  } else placeholder();
  return box;
}
