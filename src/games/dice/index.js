import { element, button, picture } from '../../ui/elements.js';
import { createAudioPlayer } from '../../media/audio.js';
import { fitViewport } from '../../ui/viewport.js';
import { rules, rollDice, destination, makeQuestion } from './plan.js';
import { forestBackground } from './scenery.js';

export function createDiceGame({ container, words, onExit, audio = createAudioPlayer(), random = Math.random }) {
  let position = 0, phase = 'idle', roll = 0, question;
  let destroyed = false, generation = 0, timer;
  let cells, counter, dice, status, panel, rollButton, pawn, quiz, quizStatus, quizContent;
  const animations = new Set();
  const stepDuration = 380;

  function stopAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function animate(node, frames, options) {
    if (!node.animate) return;
    const animation = node.animate(frames, options);
    animations.add(animation);
    animation.onfinish = () => animations.delete(animation);
  }
  function hop(from, to) {
    const [x1, y1] = coordinates(from), [x2, y2] = coordinates(to);
    const bend = from > 0 && from % 6 === 0 ? (x1 > 300 ? 40 : -40) : 0;
    // Explicit game feedback stays visible even when decorative CSS motion is reduced.
    animate(pawn, [
      { left: `${x1 / 6}%`, top: `${y1 / 4.4}%`, transform: 'translate(-50%, -85%) scale(1.12, .85)' },
      { left: `${((x1 + x2) / 2 + bend) / 6}%`, top: `${(y1 + y2) / 8.8}%`, transform: `translate(-50%, -85%) translateY(-24px) rotate(${x2 >= x1 ? 10 : -10}deg) scale(.95, 1.12)`, offset: .48 },
      { left: `${x2 / 6}%`, top: `${y2 / 4.4}%`, transform: 'translate(-50%, -85%) scale(1.16, .8)', offset: .87 },
      { left: `${x2 / 6}%`, top: `${y2 / 4.4}%`, transform: 'translate(-50%, -85%) scale(1)' },
    ], { duration: stepDuration, easing: 'ease-in-out' });
  }

  function coordinates(n) {
    if (!n) return [44, 414];
    const row = Math.floor((n - 1) / 6);
    const column = (n - 1) % 6;
    return [80 + (row % 2 ? 5 - column : column) * 88, 380 - row * 80];
  }
  function place(node, n) {
    const [x, y] = coordinates(n);
    node.style.left = `${x / 6}%`;
    node.style.top = `${y / 4.4}%`;
  }
  function say(message) {
    status.textContent = message;
    quizStatus.textContent = message;
  }
  function closeQuiz() { if (quiz?.open) quiz.close(); }
  function cancelQuestion() {
    generation++;
    audio.stop();
    closeQuiz();
    ready('이번 문제는 쉬어 가요. 주사위를 다시 굴려 주세요.');
    rollButton.focus({ preventScroll: true });
  }
  function showDice(value) {
    const dots = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    dice.replaceChildren(...Array.from({ length: 9 }, (_, i) => element('span', `dice-pip${dots[value].includes(i + 1) ? ' is-on' : ''}`)));
    dice.setAttribute('aria-label', `주사위 ${value}`);
  }

  function updateBoard(target) {
    counter.textContent = `${position} / ${rules.spaces}칸`;
    place(pawn, position);
    pawn.setAttribute('aria-label', position ? `토끼, ${position}칸` : '토끼, 출발');
    cells.forEach((cell, index) => {
      const n = index + 1;
      cell.classList.toggle('is-current', n === position);
      cell.classList.toggle('is-passed', n < position);
      cell.classList.toggle('is-target', n === target && n !== position);
      cell.textContent = n === rules.spaces ? '⚑' : String(n);
      cell.setAttribute('aria-label', `${n}칸${n === position ? ', 현재 위치' : ''}${n === rules.spaces ? ', 도착' : ''}`);
    });
  }
  function ready(message) {
    phase = 'idle';
    panel.replaceChildren();
    say(message);
    rollButton.disabled = false;
    rollButton.textContent = '주사위 굴리기';
    updateBoard();
  }
  function win() {
    phase = 'won';
    const title = element('h2', '', '도착! 정말 잘했어요!');
    title.tabIndex = -1;
    panel.replaceChildren(title, element('p', '', '30칸 여행을 모두 마쳤어요.'), button('한 번 더', 'primary', start));
    status.textContent = '성공!';
    rollButton.hidden = true;
    title.focus({ preventScroll: true });
    audio.play('assets/sounds/success.wav').catch(() => {});
  }
  function move(target) {
    if (destroyed) return;
    const from = position;
    position++;
    updateBoard(target);
    hop(from, position);
    timer = setTimeout(() => {
      if (position === target) {
        if (position === rules.spaces) win();
        else ready('정답이에요! 주사위를 다시 굴려 볼까요?');
      } else move(target);
    }, stepDuration);
  }
  function choose(word, node) {
    if (destroyed || phase !== 'question') return;
    phase = 'feedback';
    for (const choice of quizContent.querySelectorAll('button')) choice.disabled = true;
    if (word.id !== question.answer.id) {
      node.classList.add('is-wrong');
      say('아쉬워요! 이번에는 제자리예요.');
      timer = setTimeout(() => {
        closeQuiz();
        ready('이번에는 제자리! 주사위를 다시 굴려 볼까요?');
        rollButton.focus({ preventScroll: true });
      }, 650);
      return;
    }
    node.classList.add('is-correct');
    phase = 'moving';
    say(`정답이에요! ${roll}칸 앞으로 가요.`);
    const target = destination(position, roll);
    timer = setTimeout(() => {
      closeQuiz();
      // Let the browser paint the unobscured board before the first hop.
      timer = setTimeout(() => move(target), 300);
    }, 450);
  }
  async function listen(replay, choices) {
    if (destroyed || !['listening', 'question', 'audio-error'].includes(phase)) return;
    phase = 'listening';
    const token = generation;
    replay.disabled = true;
    choices.forEach(choice => { choice.disabled = true; });
    say('단어를 듣고 같은 뜻의 그림을 골라 주세요.');
    let outcome;
    try { outcome = await audio.play(question.answer.audio); } catch { outcome = 'failed'; }
    if (destroyed || token !== generation) return;
    replay.disabled = false;
    if (outcome !== 'played') {
      phase = 'audio-error';
      say('소리를 끝까지 듣지 못했어요. 다시 듣기를 눌러 주세요.');
      return;
    }
    phase = 'question';
    say('어떤 그림일까요?');
    choices.forEach(choice => { choice.disabled = false; });
  }
  function showQuestion() {
    phase = 'listening';
    question = makeQuestion(words, random);
    const heading = element('div', 'dice-question-heading');
    const word = element('h2', 'dice-word', question.answer.text);
    word.id = 'dice-question-word';
    word.lang = 'en';
    word.tabIndex = -1;
    const choices = [];
    const replay = button('↻ 다시 듣기', 'secondary dice-listen', () => listen(replay, choices));
    heading.append(word, replay);
    const options = element('div', 'dice-choices');
    question.choices.forEach((word, index) => {
      const choice = button('', 'dice-choice', () => choose(word, choice));
      choice.setAttribute('aria-label', `${index + 1}번 그림: ${word.meaningKo ?? word.text}`);
      const image = picture(word);
      image.setAttribute('aria-hidden', 'true');
      choice.append(image);
      choice.disabled = true;
      choices.push(choice);
      options.append(choice);
    });
    quizContent.replaceChildren(element('p', 'dice-quiz-caption', `주사위 ${roll} · 그림을 맞히면 앞으로!`), heading, options);
    quiz.showModal();
    word.focus({ preventScroll: true });
    listen(replay, choices);
  }
  function rollTurn() {
    if (destroyed || phase !== 'idle') return;
    phase = 'rolling';
    rollButton.disabled = true;
    panel.replaceChildren();
    roll = rollDice(random);
    dice.classList.add('is-rolling');
    animate(dice, [
      { transform: 'translate(-30px, 4px) rotate(-35deg) scale(.85)' },
      { transform: 'translate(0, -38px) rotate(100deg) scale(1.15)', offset: .22 },
      { transform: 'translate(26px, 6px) rotate(230deg) scale(1.12, .85)', offset: .45 },
      { transform: 'translate(-8px, -22px) rotate(300deg) scale(1.06)', offset: .67 },
      { transform: 'translate(2px, 4px) rotate(350deg) scale(1.1, .9)', offset: .86 },
      { transform: 'translate(0, 0) rotate(354deg) scale(1)' },
    ], { duration: 1200, easing: 'ease-in-out' });
    say('데굴데굴…');
    let frame = 0;
    function tumble() {
      if (destroyed) return;
      showDice(frame % 6 + 1);
      if (++frame < 12) { timer = setTimeout(tumble, 70 + frame * 6); return; }
      showDice(roll);
      dice.classList.remove('is-rolling');
      rollButton.textContent = `${roll}칸 도전!`;
      say(`${roll}이 나왔어요!`);
      updateBoard(destination(position, roll));
      timer = setTimeout(showQuestion, 350);
    }
    tumble();
  }
  function onVisibility() { if (document.hidden) audio.stop(); }
  function start() {
    generation++;
    clearTimeout(timer);
    stopAnimations();
    closeQuiz();
    audio.stop();
    position = 0;
    phase = 'idle';
    const screen = element('section', 'dice-screen screen');
    const title = element('h1', 'dice-title', '주사위 게임');
    title.tabIndex = -1;
    if (new Set(words.map(word => word.id)).size < rules.choices) {
      screen.append(title, element('p', '', '먼저 오늘의 단어를 배워 주세요.'), button('처음으로', 'secondary', onExit));
      container.replaceChildren(screen);
      return;
    }
    counter = element('span', 'dice-counter');
    const heading = element('div', 'dice-heading');
    heading.append(title, counter);
    const board = element('div', 'dice-board');
    board.style.backgroundImage = forestBackground;
    board.setAttribute('aria-label', '아래 출발에서 위 도착까지 이어진 S자 길 30칸');
    board.append(element('span', 'dice-start', '출발'), element('span', 'dice-goal', '도착!'));
    cells = Array.from({ length: rules.spaces }, (_, i) => {
      const cell = element('div', 'dice-cell');
      place(cell, i + 1);
      board.append(cell);
      return cell;
    });
    pawn = element('span', 'dice-pawn', '🐰');
    pawn.setAttribute('role', 'img');
    board.append(pawn);
    dice = element('span', 'dice-face');
    dice.setAttribute('role', 'img');
    dice.setAttribute('aria-label', '주사위');
    showDice(1);
    rollButton = button('주사위 굴리기', 'primary', rollTurn);
    const controls = element('div', 'dice-controls');
    const tray = element('span', 'dice-tray');
    tray.append(dice);
    controls.append(tray, rollButton);
    status = element('p', 'dice-status');
    status.setAttribute('role', 'status');
    panel = element('div', 'dice-panel');
    quiz = element('dialog', 'dice-quiz');
    quiz.setAttribute('aria-labelledby', 'dice-question-word');
    quiz.setAttribute('aria-describedby', 'dice-question-status');
    quizContent = element('div', 'dice-quiz-content');
    quizStatus = element('p', 'dice-quiz-status');
    quizStatus.id = 'dice-question-status';
    quizStatus.setAttribute('role', 'status');
    const close = button('×', 'dice-quiz-close', () => {
      if (['listening', 'question', 'audio-error'].includes(phase)) cancelQuestion();
    });
    close.setAttribute('aria-label', '문제 닫기');
    quiz.addEventListener('cancel', event => {
      event.preventDefault();
      if (['listening', 'question', 'audio-error'].includes(phase)) cancelQuestion();
    });
    quiz.append(close, quizContent, quizStatus);
    screen.append(heading, element('p', 'dice-instructions', '단어를 듣고 그림을 맞히면, 주사위 수만큼 앞으로!'),
      board, controls, status, panel, button('처음으로', 'secondary dice-exit', onExit));
    container.replaceChildren(screen, quiz);
    ready('주사위를 굴려 여행을 시작해요.');
    if (typeof ResizeObserver !== 'undefined') fitViewport(container);
    title.focus({ preventScroll: true });
    document.addEventListener('visibilitychange', onVisibility);
  }
  return {
    start,
    destroy() {
      destroyed = true;
      generation++;
      clearTimeout(timer);
      stopAnimations();
      closeQuiz();
      audio.stop();
      document.removeEventListener('visibilitychange', onVisibility);
      container.replaceChildren();
    },
  };
}
