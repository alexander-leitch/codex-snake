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
  ctx.fillStyle = '#fcfcfc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  drawFoodCell(state.food.x, state.food.y);

  for (const part of state.snake) {
    drawSnakeCell(part.x, part.y);
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

function drawGrid() {
  ctx.strokeStyle = '#e7e7e7';
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

function drawSnakeCell(x, y) {
  const px = x * cellSize + 1;
  const py = y * cellSize + 1;
  const size = cellSize - 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, size, size);
  ctx.clip();

  ctx.fillStyle = '#1f7a1f';
  ctx.fillRect(px, py, size, size);

  ctx.strokeStyle = '#b8ebb8';
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.08));
  const step = Math.max(6, Math.floor(size / 3));
  for (let o = -size; o <= size; o += step) {
    ctx.beginPath();
    ctx.moveTo(px + o, py + size);
    ctx.lineTo(px + o + size, py);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFoodCell(x, y) {
  const px = x * cellSize + 1;
  const py = y * cellSize + 1;
  const size = cellSize - 2;
  const inner = Math.max(2, Math.floor(size * 0.18));

  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, size, size);
  ctx.clip();

  ctx.fillStyle = '#d13a32';
  ctx.fillRect(px, py, size, size);

  ctx.fillStyle = '#ffe4e1';
  ctx.fillRect(px + inner, py + inner, size - inner * 2, size - inner * 2);

  ctx.strokeStyle = '#7f1c16';
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.1));
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + size, py + size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px + size, py);
  ctx.lineTo(px, py + size);
  ctx.stroke();
  ctx.restore();
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
draw();
requestAnimationFrame(loop);
