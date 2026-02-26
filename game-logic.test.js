import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  expandGrid,
  setDirection,
  spawnFood,
  step,
  togglePause
} from './game-logic.js';

test('moves one cell in current direction', () => {
  const state = createInitialState({
    gridSize: 12,
    start: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ],
    direction: 'right',
    rng: () => 0.8
  });

  step(state);
  assert.deepEqual(state.snake[0], { x: 6, y: 5 });
  assert.equal(state.snake.length, 3);
  assert.equal(state.status, 'running');
});

test('grows and increments score when food is eaten', () => {
  const rngValues = [0.1, 0.9];
  let idx = 0;
  const state = createInitialState({
    gridSize: 10,
    start: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 }
    ],
    direction: 'right',
    rng: () => rngValues[idx++] ?? 0.5
  });

  state.food = { x: 3, y: 2 };
  step(state);

  assert.equal(state.score, 1);
  assert.equal(state.snake.length, 4);
  assert.notDeepEqual(state.food, { x: 3, y: 2 });
});

test('prevents immediate reverse direction', () => {
  const state = createInitialState({
    direction: 'right',
    rng: () => 0.2
  });

  setDirection(state, 'left');
  step(state);

  assert.equal(state.direction, 'right');
});

test('detects wall collision as game over', () => {
  const state = createInitialState({
    gridSize: 4,
    start: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 }
    ],
    direction: 'right',
    rng: () => 0.9
  });

  step(state);
  assert.equal(state.status, 'gameover');
});

test('detects self collision as game over', () => {
  const state = createInitialState({
    gridSize: 8,
    start: [
      { x: 3, y: 3 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 }
    ],
    direction: 'left',
    rng: () => 0.9
  });

  step(state);
  assert.equal(state.status, 'gameover');
});

test('spawnFood never returns a snake cell', () => {
  const values = [0.2, 0.2, 0.3, 0.3, 0.9, 0.9];
  let i = 0;
  const state = createInitialState({
    gridSize: 5,
    start: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 }
    ],
    rng: () => values[i++] ?? 0.95
  });

  state.snake = [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 }
  ];

  const food = spawnFood(state, state.rng);
  const overlaps = state.snake.some((part) => part.x === food.x && part.y === food.y);
  assert.equal(overlaps, false);
});

test('paused state does not advance snake until resumed', () => {
  const state = createInitialState({
    start: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ],
    direction: 'right',
    rng: () => 0.9
  });

  step(state);
  const headBeforePause = { ...state.snake[0] };
  togglePause(state);
  step(state);
  assert.deepEqual(state.snake[0], headBeforePause);
  togglePause(state);
  step(state);
  assert.deepEqual(state.snake[0], { x: headBeforePause.x + 1, y: headBeforePause.y });
});

test('expandGrid increases board and shifts entities inward', () => {
  const state = createInitialState({
    gridSize: 20,
    start: [
      { x: 10, y: 10 },
      { x: 9, y: 10 }
    ],
    rng: () => 0.8
  });
  state.food = { x: 3, y: 4 };

  const changed = expandGrid(state, 4, 44);

  assert.equal(changed, true);
  assert.equal(state.gridSize, 24);
  assert.deepEqual(state.snake[0], { x: 12, y: 12 });
  assert.deepEqual(state.food, { x: 5, y: 6 });
});

test('expandGrid respects maximum grid size', () => {
  const state = createInitialState({
    gridSize: 44,
    rng: () => 0.8
  });

  const changed = expandGrid(state, 4, 44);
  assert.equal(changed, false);
  assert.equal(state.gridSize, 44);
});

test('buffers quick turn sequence across ticks', () => {
  const state = createInitialState({
    gridSize: 12,
    start: [
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 }
    ],
    direction: 'right',
    rng: () => 0.9
  });

  setDirection(state, 'up');
  setDirection(state, 'left');

  step(state);
  assert.deepEqual(state.snake[0], { x: 6, y: 5 });

  step(state);
  assert.deepEqual(state.snake[0], { x: 5, y: 5 });
});
