import * as gameLogic from './game-logic.js';
import {
  PROGRESSION,
  getCurrentTickMs,
  getSizeLevel,
  getSpeedLevel,
  getTargetGridSize
} from './progression.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const speedLevelEl = document.getElementById('speed-level');
const sizeLevelEl = document.getElementById('size-level');
const speedEl = document.getElementById('speed');
const boardSizeEl = document.getElementById('board-size');
const themeModeEl = document.getElementById('theme-mode');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const pauseBtn = document.getElementById('pause');
const controls = document.querySelectorAll('[data-dir]');

const createInitialState = gameLogic.createInitialState;
const restart = gameLogic.restart;
const setDirection = gameLogic.setDirection;
const step = gameLogic.step;
const togglePause = gameLogic.togglePause;
const expandGrid = gameLogic.expandGrid ?? (() => false);

const state = createInitialState({ gridSize: PROGRESSION.baseGridSize });
let cellSize = canvas.width / state.gridSize;
const THEME_STORAGE_KEY = 'snake-theme-mode';
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

let accumulator = 0;
let lastTime = 0;

const keyToDir = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right'
};

function draw() {
  const palette = getPalette();
  ctx.fillStyle = palette.board;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid(palette);

  drawFoodCell(state.food.x, state.food.y, palette);

  for (const part of state.snake) {
    drawSnakeCell(part.x, part.y, palette);
  }

  scoreEl.textContent = String(state.score);
  speedLevelEl.textContent = String(getSpeedLevel(state.score));
  sizeLevelEl.textContent = String(getSizeLevel(state.score));
  speedEl.textContent = `${Math.round(getCurrentTickMs(state.score))}ms`;
  boardSizeEl.textContent = `${state.gridSize}x${state.gridSize}`;
  statusEl.textContent =
    state.status === 'gameover'
      ? 'Game over. Press restart to play again.'
      : state.status === 'paused'
        ? 'Paused'
        : state.status === 'idle'
          ? 'Press any direction to start'
          : 'Running';
  pauseBtn.textContent = state.status === 'paused' ? 'Resume' : 'Pause';
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const cssSize = Math.max(240, Math.floor(Math.min(rect.width, rect.height || rect.width)));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssSize * dpr);
  canvas.height = Math.floor(cssSize * dpr);
  cellSize = canvas.width / state.gridSize;
}

function drawGrid(palette) {
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= state.gridSize; i += 1) {
    const p = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function drawSnakeCell(x, y, palette) {
  const px = x * cellSize + 1;
  const py = y * cellSize + 1;
  const size = cellSize - 2;

  // Solid base color
  ctx.fillStyle = palette.snake;
  ctx.fillRect(px, py, size, size);

  // Underlining pattern
  const lineH = Math.max(2, Math.floor(size * 0.2));
  ctx.fillStyle = palette.snakeStripe;
  ctx.fillRect(px, py + size - lineH, size, lineH);
}

function drawFoodCell(x, y, palette) {
  const px = x * cellSize + 1;
  const py = y * cellSize + 1;
  const size = cellSize - 2;
  const offset = Math.max(1, Math.floor(size * 0.1));
  const innerSize = size - offset * 2;

  // Solid base color inside a slightly smaller rect
  ctx.fillStyle = palette.food;
  ctx.fillRect(px + offset, py + offset, innerSize, innerSize);

  // Underlining pattern
  const lineH = Math.max(2, Math.floor(innerSize * 0.2));
  ctx.fillStyle = palette.foodStripe;
  ctx.fillRect(px + offset, py + offset + innerSize - lineH, innerSize, lineH);
}

function syncBoardSizeToScore() {
  const target = getTargetGridSize(state.score);
  while (state.gridSize < target) {
    const expanded = expandGrid(
      state,
      PROGRESSION.sizeLevelGridIncrease,
      PROGRESSION.maxGridSize
    );
    if (!expanded) break;
    resizeCanvas();
  }
}

function update(ms) {
  accumulator += ms;
  while (accumulator >= getCurrentTickMs(state.score)) {
    const tickMs = getCurrentTickMs(state.score);
    step(state);
    syncBoardSizeToScore();

    accumulator -= tickMs;
  }
}

function loop(timestamp) {
  const delta = lastTime === 0 ? 0 : timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function handleDirection(direction) {
  setDirection(state, direction);
}

function getPalette() {
  const css = getComputedStyle(document.documentElement);
  return {
    board: css.getPropertyValue('--board').trim(),
    grid: css.getPropertyValue('--grid').trim(),
    snake: css.getPropertyValue('--snake').trim(),
    snakeStripe: css.getPropertyValue('--snake-stripe').trim(),
    food: css.getPropertyValue('--food').trim(),
    foodInner: css.getPropertyValue('--food-inner').trim(),
    foodStripe: css.getPropertyValue('--food-stripe').trim()
  };
}

function resolveTheme(mode) {
  if (mode === 'day' || mode === 'night') return mode;
  return systemThemeQuery.matches ? 'night' : 'day';
}

function applyTheme(mode) {
  const effectiveTheme = resolveTheme(mode);
  document.documentElement.dataset.theme = effectiveTheme;
  document.documentElement.dataset.themeMode = mode;
}

function initializeTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const mode = stored === 'day' || stored === 'night' || stored === 'auto' ? stored : 'auto';
  themeModeEl.value = mode;
  applyTheme(mode);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    restart(state, { gridSize: PROGRESSION.baseGridSize });
    accumulator = 0;
    resizeCanvas();
    draw();
    return;
  }

  if (event.key === ' ' || event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    togglePause(state);
    draw();
    return;
  }

  const dir = keyToDir[event.key];
  if (!dir) return;
  event.preventDefault();
  handleDirection(dir);
});

for (const btn of controls) {
  btn.addEventListener('click', () => handleDirection(btn.dataset.dir));
}

themeModeEl.addEventListener('change', () => {
  const mode = themeModeEl.value;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
  draw();
});

systemThemeQuery.addEventListener('change', () => {
  if (themeModeEl.value === 'auto') {
    applyTheme('auto');
    draw();
  }
});

restartBtn.addEventListener('click', () => {
  restart(state, { gridSize: PROGRESSION.baseGridSize });
  accumulator = 0;
  resizeCanvas();
  draw();
});

pauseBtn.addEventListener('click', () => {
  togglePause(state);
  draw();
});

window.render_game_to_text = () =>
  JSON.stringify({
    coordinates: 'origin at top-left; x increases right, y increases down',
    status: state.status,
    score: state.score,
    direction: state.direction,
    snake: state.snake,
    food: state.food,
    gridSize: state.gridSize
  });

window.advanceTime = (ms) => {
  update(ms);
  draw();
};

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

resizeCanvas();
initializeTheme();
draw();
requestAnimationFrame(loop);
