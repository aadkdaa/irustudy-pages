import { loadData } from './data/load.js';
import { selectWords, stageLabel } from './core/curriculum.js';
import { STORAGE_KEY, InvalidProgressError, recoverProgress, loadProgress, recordCompletion, changeStage, dateKey } from './core/progress.js';
import { createAudioPlayer } from './media/audio.js';
import { getRoutine } from './routines/registry.js';
import { element, button, picture } from './ui/elements.js';

const app = document.querySelector('#app');
const settings = document.querySelector('#settings');
const audio = createAudioPlayer();
let data, progress, routine;
let screen = 'home';
let recoveryMode = false;

function clearRoutine() { routine?.destroy(); routine = null; }
function save(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  progress = next;
}
function focusTitle(container) {
  const title = container.querySelector('h1');
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}
function home() {
  clearRoutine();
  screen = 'home';
  const section = element('section', 'home-screen screen');
  const intro = element('div', 'home-copy');
  intro.append(element('p', 'eyebrow', 'HELLO, LITTLE EXPLORER'));
  const title = element('h1', 'home-title');
  title.append(document.createTextNode('작은 말 한마디,'), element('br'), element('span', 'title-accent', '커지는 나의 세상.'));
  intro.append(title, element('p', 'home-subtitle', '듣고, 따라 하고, 혼자서도 말해 봐요.'));
  intro.append(button('시작', 'primary start-button', start));
  const art = element('div', 'home-art');
  art.setAttribute('aria-hidden', 'true');
  const book = element('div', 'book');
  book.append(element('span', 'book-eyebrow', 'MY LITTLE WORD BOOK'));
  const letters = element('div', 'book-letters');
  letters.append(element('span', '', 'a'), element('span', '', 'b'), element('span', '', 'c'));
  book.append(letters, element('span', 'book-caption', 'a little adventure'), element('span', 'book-flower', '✳'));
  art.append(element('span', 'orbit orbit-one'), element('span', 'orbit orbit-two'), book, element('span', 'art-spark', '✦'));
  section.append(intro, art);
  app.replaceChildren(section);
}
function result(words, storageError) {
  clearRoutine();
  screen = 'result';
  const section = element('section', 'result-screen screen');
  section.append(element('div', 'celebration', '✦'), element('p', 'eyebrow', 'A LITTLE MORE, EVERY DAY'));
  section.append(element('h1', 'result-title', '오늘 학습을 완료했어요'));
  section.append(element('p', 'result-subtitle', '오늘 만난 단어들, 잘했어요!'));
  const grid = element('div', 'result-words');
  for (const word of words) {
    const item = element('article', 'result-word');
    item.append(picture(word, true), element('span', '', word.text));
    grid.append(item);
  }
  section.append(grid);
  if (storageError) section.append(element('p', 'error-note', '기록을 저장하지 못했어요. 보호자에게 알려 주세요.'));
  section.append(button('확인  ✓', 'primary result-confirm', () => { home(); focusTitle(app); }));
  app.replaceChildren(section);
  focusTitle(section);
}
function start() {
  clearRoutine();
  // Re-read persistent state to avoid using an old tab's stage.
  try { progress = loadProgress(localStorage, data.stages); } catch (error) { showError(error); return; }
  const stageId = progress.currentStage;
  const words = selectWords(data, stageId);
  let completed = false;
  screen = 'routine';
  routine = getRoutine(data.config.activeRoutine)({
    container: app, words, config: data.routine, audio,
    onAbort() { home(); focusTitle(app); },
    onComplete() {
      if (completed) return;
      completed = true;
      let failed = false;
      try {
        const latest = loadProgress(localStorage, data.stages);
        save(recordCompletion(latest, {
          stageId, date: dateKey(new Date(), data.config.timeZone), wordIds: words.map(word => word.id),
        }, data.stages, data.config.completionDays));
      } catch { failed = true; }
      result(words, failed);
    },
  });
  routine.start();
}
function showError(error) {
  clearRoutine();
  screen = 'error';
  const section = element('section', 'error-screen screen');
  section.append(element('h1', '', '잠깐, 책을 펼치지 못했어요.'));
  section.append(element('p', '', '새로고침해 주세요. 계속되면 보호자에게 알려 주세요.'));
  section.append(button('다시 열기', 'primary', () => location.reload()));
  if (data && error instanceof InvalidProgressError) {
    section.append(element('p', '', '저장된 진도를 읽지 못했어요. 보호자가 시작 단계를 선택해 복구할 수 있어요.'));
    section.append(button('보호자: 진도 복구', 'secondary', () => openSettings(true)));
  }
  app.replaceChildren(section);
}

function openSettings(recover = false) {
  if (!data || (screen !== 'home' && !(recover === true && screen === 'error'))) return;
  recoveryMode = recover === true;
  const select = document.querySelector('#stage-select');
  select.replaceChildren(...data.stages.map(stage => {
    const option = element('option', '', `${stageLabel(stage)} · ${selectWords(data, stage.id).map(word => word.text).join(', ')}`);
    option.value = stage.id;
    return option;
  }));
  select.value = recoveryMode ? data.stages[0].id : progress.currentStage;
  document.querySelector('#settings-title').textContent = recoveryMode ? '진도 복구' : '학습 설정';
  document.querySelector('#saved-status').textContent = recoveryMode ? '기억하고 있는 학습 단계를 선택해 주세요.' : `현재 ${stageLabel(data.stages.find(stage => stage.id === progress.currentStage))} · ${progress.completedDays}/${data.config.completionDays}일 완료`;
  document.querySelector('#settings-help').textContent = recoveryMode
    ? '선택한 단계에서 완료 일수를 처음부터 셉니다. 이전 학습 기록은 복원되지 않아요. 손상된 원본은 이 브라우저에 별도로 보관합니다.'
    : '다른 단계로 변경하면 해당 단계의 완료 일수는 처음부터 셉니다. 오늘 학습 기록은 유지돼요.';
  document.querySelector('#settings-form button[type="submit"]').textContent = recoveryMode ? '이 단계로 복구' : '저장';
  settings.showModal();
}
let holdTimer;
const brand = document.querySelector('#brand');
brand.addEventListener('pointerdown', () => { holdTimer = setTimeout(openSettings, 1600); });
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) brand.addEventListener(type, () => clearTimeout(holdTimer));
brand.addEventListener('contextmenu', event => event.preventDefault());
brand.addEventListener('keydown', event => { if (event.altKey && event.key === 'Enter') openSettings(); });
document.querySelector('#close-settings').addEventListener('click', () => settings.close());
document.querySelector('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const stageId = Number(document.querySelector('#stage-select').value);
    if (recoveryMode) progress = recoverProgress(localStorage, stageId, data.stages);
    else save(changeStage(loadProgress(localStorage, data.stages), stageId, data.stages));
    settings.close();
    home();
  } catch { document.querySelector('#saved-status').textContent = '저장하지 못했어요. 브라우저 저장 설정을 확인해 주세요.'; }
});
window.addEventListener('pagehide', () => { clearTimeout(holdTimer); clearRoutine(); });
window.addEventListener('pageshow', event => {
  if (event.persisted && data) {
    try { progress = loadProgress(localStorage, data.stages); home(); }
    catch (error) { showError(error); }
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.stop();
});
try {
  data = await loadData();
  progress = loadProgress(localStorage, data.stages);
  home();
} catch (error) {
  console.error(error);
  showError(error);
}
